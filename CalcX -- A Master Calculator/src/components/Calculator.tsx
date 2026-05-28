// @ts-nocheck
/** Purpose: Main Calculator component with stealth features and multi-mode support (Scientific, MBA, CAT). */
import React, { useState, useEffect, useCallback, useRef } from "react";
import { View, Text, Pressable, StyleSheet, useWindowDimensions, Alert, Modal, FlatList, TouchableWithoutFeedback, Animated, ScrollView, Vibration } from "react-native";
import { isWeb, isIOS, isAndroid, select } from "../utils/platform";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

// ===== HELPER FUNCTIONS =====  
const gcd = (a, b) => (!b ? a : gcd(b, a % b));
const lcm = (a, b) => (a * b) / gcd(b, a % b);

const safeEvaluate = (expression, mode = 'deg') => {
  try {
    const whitelist = /[0-9+\-*/.()\[\]{}|^√πe% \s,]|sin|cos|tan|asin|acos|atan|sinh|cosh|tanh|asinh|acosh|atanh|log|ln|logb|fact|nPr|nCr|sqrt|cbrt|abs|nroot|Math/g;
    const blacklisted = /constructor|__proto__|prototype|eval|Function|window|global|process|require|import/i;
    
    if (blacklisted.test(expression)) {
      return "Error";
    }

    const sanitizedExpr = expression.match(whitelist)?.join('') || '';

    if (sanitizedExpr !== expression.replace(/\s/g, '')) {
      return "Error";
    }

    let expr = sanitizedExpr
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/π/g, 'Math.PI')
      .replace(/\be\b/g, 'Math.E')
      .replace(/\^/g, '**')
      .replace(/[[{]/g, '(')
      .replace(/[\]}]/g, ')')
      .replace(/\|([^|]+)\|/g, 'Math.abs($1)')
      .replace(/(\d)\(/g, '$1*(')
      .replace(/\)(\d)/g, ')*$1')
      .replace(/%/g, '/100')
      .replace(/(\d+)√(\d+)/g, 'nroot($1,$2)')
      .replace(/(\d+)√\(([^)]+)\)/g, 'nroot($1,$2)')
      .replace(/√\(([^)]+)\)/g, 'Math.sqrt($1)')
      .replace(/√(\d+)/g, 'Math.sqrt($1)');

    const openParens = (expr.match(/\(/g) || []).length;
    const closeParens = (expr.match(/\)/g) || []).length;
    if (openParens > closeParens) {
      expr += ')'.repeat(openParens - closeParens);
    }

    const toRad = (x) => mode === 'deg' ? x * (Math.PI / 180) : x;
    const toDeg = (x) => mode === 'deg' ? x * (180 / Math.PI) : x;

    const scope = {
      sin: (x) => Math.sin(toRad(x)),
      cos: (x) => Math.cos(toRad(x)),
      tan: (x) => Math.tan(toRad(x)),
      asin: (x) => toDeg(Math.asin(x)),
      acos: (x) => toDeg(Math.acos(x)),
      atan: (x) => toDeg(Math.atan(x)),
      sinh: Math.sinh,
      cosh: Math.cosh,
      tanh: Math.tanh,
      asinh: Math.asinh,
      acosh: Math.acosh,
      atanh: Math.atanh,
      log: Math.log10,
      ln: Math.log,
      logb: (b, x) => Math.log(x) / Math.log(b),
      fact: (n) => {
        if (n < 0) return NaN;
        if (n === 0) return 1;
        let res = 1;
        for (let i = 1; i <= n; i++) res *= i;
        return res;
      },
      nPr: (n, r) => {
        if (n < r) return 0;
        const f = (x) => { let v = 1; for (let i = 1; i <= x; i++)v *= i; return v; };
        return f(n) / f(n - r);
      },
      nCr: (n, r) => {
        if (n < r) return 0;
        const f = (x) => { let v = 1; for (let i = 1; i <= x; i++)v *= i; return v; };
        return f(n) / (f(r) * f(n - r));
      },
      sqrt: Math.sqrt,
      cbrt: Math.cbrt,
      nroot: (y, x) => Math.pow(x, 1 / y),
      abs: Math.abs,
      Math: Math
    };

    const keys = Object.keys(scope);
    const values = Object.values(scope);
    const func = new Function(...keys, `return ${expr};`);
    const result = func(...values);

    const precision = 10000000000;
    return Math.round(result * precision) / precision;
  } catch (e) {
    return "Error";
  }
};

const formatNumber = (numStr) => {
  if (!numStr || isNaN(parseFloat(numStr))) return numStr;
  const parts = numStr.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join('.');
};

const AnimatedGhostLine = ({ display, THEME }) => {
  const [context, setContext] = useState(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const getGhostContext = (val) => {
      if (!val || val === '0' || val === 'Error' || val === 'Infinity' || val === 'NaN') return null;
      const cleanVal = val.replace(/,/g, '');
      const num = parseFloat(cleanVal);
      if (isNaN(num)) return null;

      if (Number.isInteger(num) && num > 0 && num < 1000000000) {
        return `HEX: 0x${num.toString(16).toUpperCase()}  |  BIN: ${num.toString(2)}`;
      }

      if (num >= 1000) {
        return `EST: $${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }

      return null;
    };

    const newContext = getGhostContext(display);

    if (newContext !== context) {
      if (newContext) {
        setContext(newContext);
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: !isWeb }).start();
      } else {
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: !isWeb }).start(() => {
          setContext(null);
        });
      }
    }
  }, [display, context]);

  if (!context) return null;

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <Text style={{
        color: THEME.textAlt,
        fontSize: 11,
        fontFamily: 'Inter_500Medium',
        letterSpacing: 0.8,
        opacity: 0.5
      }}>
        {context}
      </Text>
    </Animated.View>
  );
};

const renderHighlightedExpression = (expression, THEME, isDark, fontSize, cursorPos) => {
  if (!expression || expression === "0") {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{ color: THEME.textMain, fontSize, fontWeight: '400' }}>0</Text>
        {(cursorPos === 0 || cursorPos === null) && <Cursor THEME={THEME} fontSize={fontSize} />}
      </View>
    );
  }
  if (expression === "Error" || expression === "Infinity" || expression === "NaN") return <Text style={{ color: '#ef4444', fontSize }}>{expression}</Text>;

  const effectiveCursor = cursorPos === null ? expression.length : cursorPos;
  const symbolMap = { '*': '×', '/': '÷', '-': '−', 'sqrt': '√', 'pi': 'π' };

  const renderToken = (token, color, fontWeight, key, isSuperscript = false) => {
    const displayText = symbolMap[token] || token;
    return (
      <View key={key} style={{ marginTop: isSuperscript ? -fontSize * 0.45 : 0 }}>
        <Text style={{
          color,
          fontSize: isSuperscript ? fontSize * 0.65 : fontSize,
          fontWeight
        }}>
          {displayText}
        </Text>
      </View>
    );
  };

  const tokens = expression.split(/([+\-*/%^()])|(\d+\.?\d*)|(sqrt|pi|[a-z]+)/gi).filter(Boolean);
  const opColor = isDark ? '#A855F7' : '#9333EA';
  const funcColor = isDark ? '#22d3ee' : '#0891b2';

  let currentIdx = 0;
  const elements = [];
  let cursorRendered = false;
  let isNextSuperscript = false;

  tokens.forEach((token, index) => {
    let color = THEME.textMain;
    let fontWeight = '400';

    if (/[+\-*/%^()]/.test(token)) {
      color = opColor;
      fontWeight = '700';
    } else if (/sqrt|pi|[a-z]+/i.test(token)) {
      color = funcColor;
    }

    const activeSuperscript = isNextSuperscript;

    if (token === '^') {
      isNextSuperscript = true;
      currentIdx += 1;
      return;
    } else if (activeSuperscript && !/[0-9.]/.test(token)) {
      isNextSuperscript = false;
    }

    const tokenStart = currentIdx;
    const tokenEnd = currentIdx + token.length;

    if (!cursorRendered && effectiveCursor >= tokenStart && effectiveCursor <= tokenEnd) {
      const relativePos = effectiveCursor - tokenStart;
      const before = token.slice(0, relativePos);
      const after = token.slice(relativePos);

      if (before) elements.push(renderToken(before, color, fontWeight, `t-${index}-b`, activeSuperscript));
      elements.push(<Cursor key="ghost-cursor" THEME={THEME} fontSize={activeSuperscript ? fontSize * 0.65 : fontSize} isSuperscript={activeSuperscript} />);
      cursorRendered = true;
      if (after) elements.push(renderToken(after, color, fontWeight, `t-${index}-a`, activeSuperscript));
    } else {
      elements.push(renderToken(token, color, fontWeight, `t-${index}`, activeSuperscript));
    }

    currentIdx = tokenEnd;
  });

  if (!cursorRendered) {
    elements.push(<Cursor key="ghost-cursor-end" THEME={THEME} fontSize={fontSize} />);
  }

  return elements;
};

const Cursor = ({ THEME, fontSize, isSuperscript }) => {
  const blinkAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim, { toValue: 0, duration: 500, useNativeDriver: !isWeb }),
        Animated.timing(blinkAnim, { toValue: 1, duration: 500, useNativeDriver: !isWeb }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  return (
    <Animated.View style={{
      width: 2,
      height: fontSize * (isSuperscript ? 0.7 : 0.85),
      backgroundColor: '#fb7185',
      opacity: blinkAnim,
      marginHorizontal: 1,
      marginTop: isSuperscript ? -fontSize * 0.35 : 0,
      borderRadius: 1,
    }} />
  );
};

const CalcButton = React.memo(({ label, type = "number", onPress, onLongPress, style, textStyle, THEME, isTablet, isDark }) => {
  let colors = THEME.btnNumber;
  let baseText = THEME.textMain;
  let fontSize = isTablet ? 34 : 24;

  if (type === "equal") {
    colors = THEME.btnEqual;
    baseText = "#FFF";
  } else if (type === "op") {
    colors = THEME.btnOp;
    baseText = "#FFF";
  } else if (type === "top") {
    colors = THEME.btnTop;
    baseText = isDark ? "#0F172A" : "#FFFFFF";
  } else if (type === "sci" || type === "func" || type === "constant") {
    colors = THEME.btnSci;
    baseText = THEME.textMain;
    fontSize = isTablet ? 22 : 16;
  }

  if (label === "AC") {
    colors = isDark ? ['#ea580c', '#c2410c'] : ['#fb923c', '#ea580c'];
    baseText = "#FFF";
  }

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [
        styles.calcBtn,
        style,
        pressed && { opacity: 0.8, transform: [{ scale: 0.96 }] }
      ]}
    >
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: 4 }]}
      />
      <Text style={[styles.calcBtnText, { color: baseText, fontSize }, textStyle]}>
        {label}
      </Text>
    </Pressable>
  );
});

const Keypad = React.memo(({ calcMode, btnSize, handlePress, handleEmergencyReset, THEME, isTablet, isDark, degMode, isSecond, setIsSecond }) => {
  const isBasic = calcMode === 'basic';
  let basicHeight = 68;
  let denseHeight = 48;
  let sciRowHeight = 32;

  if (btnSize === 'small') {
    basicHeight = 60;
    denseHeight = 40;
    sciRowHeight = 30;
  }
  if (btnSize === 'large') {
    basicHeight = 80;
    denseHeight = 56;
    sciRowHeight = 36;
  }

  const dynamicRowStyle = { ...styles.calcRow, height: basicHeight };
  const dynamicDenseStyle = { ...styles.calcRowDense, height: denseHeight };
  const dynamicSciStyle = { ...styles.calcRowDense, height: sciRowHeight };

  const rowStyle = isBasic ? dynamicRowStyle : dynamicDenseStyle;
  const textStyle = isBasic ? undefined : styles.calcBtnTextDense;

  const renderBtn = (l, t, opVal, typeVal, s, ts, lp) => (
    <CalcButton
      key={l}
      label={l}
      type={t}
      onPress={() => handlePress(opVal || l, typeVal || t)}
      onLongPress={lp}
      style={s}
      textStyle={ts}
      THEME={THEME}
      isTablet={isTablet}
      isDark={isDark}
    />
  );

  return (
    <>
      {calcMode === 'sci' && (
        <>
          <View style={dynamicSciStyle}>
            {renderBtn("2nd", "sci", null, "toggle_2nd", { backgroundColor: isSecond ? '#f59e0b' : '#334155' }, styles.calcBtnTextSmall, () => setIsSecond(!isSecond))}
            {renderBtn(degMode.toUpperCase(), "sci", "DEG", "deg", { backgroundColor: '#0ea5e9' }, styles.calcBtnTextSmall)}
            {renderBtn("[", "sci", "[", "sci", null, styles.calcBtnTextSmall)}
            {renderBtn("]", "sci", "]", "sci", null, styles.calcBtnTextSmall)}
            {renderBtn("|x|", "sci", "|", "sci", null, styles.calcBtnTextSmall)}
          </View>
          <View style={dynamicSciStyle}>
            {renderBtn(isSecond ? "asin" : "sin", "sci", isSecond ? "asin" : "sin", "sci_func", null, styles.calcBtnTextSmall)}
            {renderBtn(isSecond ? "acos" : "cos", "sci", isSecond ? "acos" : "cos", "sci_func", null, styles.calcBtnTextSmall)}
            {renderBtn(isSecond ? "atan" : "tan", "sci", isSecond ? "atan" : "tan", "sci_func", null, styles.calcBtnTextSmall)}
            {renderBtn(isSecond ? "10^x" : "log", "sci", isSecond ? "10^" : "log", isSecond ? "op" : "sci_func", null, styles.calcBtnTextSmall)}
            {renderBtn(isSecond ? "e^x" : "ln", "sci", isSecond ? "e^" : "ln", isSecond ? "op" : "sci_func", null, styles.calcBtnTextSmall)}
          </View>
          <View style={dynamicSciStyle}>
            {renderBtn(isSecond ? "asinh" : "sinh", "sci", isSecond ? "asinh" : "sinh", "sci_func", null, styles.calcBtnTextSmall)}
            {renderBtn(isSecond ? "acosh" : "cosh", "sci", isSecond ? "acosh" : "cosh", "sci_func", null, styles.calcBtnTextSmall)}
            {renderBtn(isSecond ? "atanh" : "tanh", "sci", isSecond ? "atanh" : "tanh", "sci_func", null, styles.calcBtnTextSmall)}
            {renderBtn(isSecond ? "{" : "nPr", "sci", isSecond ? "{" : "nPr", "sci_func", null, styles.calcBtnTextSmall)}
            {renderBtn(isSecond ? "}" : "nCr", "sci", isSecond ? "}" : "nCr", "sci_func", null, styles.calcBtnTextSmall)}
          </View>
          <View style={dynamicSciStyle}>
            {renderBtn(isSecond ? "√" : "x²", "func", isSecond ? "sqrt" : "^2", isSecond ? "sci_func" : "op", null, styles.calcBtnTextSmall)}
            {renderBtn(isSecond ? "3√" : "x³", "func", isSecond ? "cbrt" : "^3", isSecond ? "sci_func" : "op", null, styles.calcBtnTextSmall)}
            {renderBtn("y√x", "sci", "√", "op", null, styles.calcBtnTextSmall)}
            {renderBtn("xⁿ", "sci", "^", "op", null, styles.calcBtnTextSmall)}
            {renderBtn("(", "sci", "(", "sci", null, styles.calcBtnTextSmall)}
          </View>
          <View style={dynamicSciStyle}>
            {renderBtn(")", "sci", ")", "sci", null, styles.calcBtnTextSmall)}
            {renderBtn("e", "constant", "e", "constant", null, styles.calcBtnTextSmall)}
            {renderBtn("π", "constant", "π", "constant", null, styles.calcBtnTextSmall)}
            {renderBtn("x!", "func", "fact", "sci_func", null, styles.calcBtnTextSmall)}
            {renderBtn("1/x", "sci", "1/x", "func", null, styles.calcBtnTextSmall)}
          </View>
        </>
      )}

      {calcMode === 'cat' && (
        <>
          <View style={dynamicSciStyle}>
            {renderBtn("(", "sci", "(", "sci", null, styles.calcBtnTextSmall)}
            {renderBtn(")", "sci", ")", "sci", null, styles.calcBtnTextSmall)}
            {renderBtn("[", "sci", "[", "sci", null, styles.calcBtnTextSmall)}
            {renderBtn("]", "sci", "]", "sci", null, styles.calcBtnTextSmall)}
            {renderBtn("|x|", "sci", "|", "sci", null, styles.calcBtnTextSmall)}
          </View>
          <View style={dynamicSciStyle}>
            {renderBtn("{", "sci", "{", "sci", null, styles.calcBtnTextSmall)}
            {renderBtn("}", "sci", "}", "sci", null, styles.calcBtnTextSmall)}
            {renderBtn("x²", "func", "x²", "func", null, styles.calcBtnTextSmall)}
            {renderBtn("x³", "func", "^3", "op", null, styles.calcBtnTextSmall)}
            {renderBtn("xⁿ", "sci", "^", "op", null, styles.calcBtnTextSmall)}
          </View>
          <View style={dynamicSciStyle}>
            {renderBtn("√", "func", "√", "func", null, styles.calcBtnTextSmall)}
            {renderBtn("3√", "sci", "cbrt", "sci_func", null, styles.calcBtnTextSmall)}
            {renderBtn("y√x", "sci", "√", "op", null, styles.calcBtnTextSmall)}
            {renderBtn("1/x", "sci", "1/x", "func", null, styles.calcBtnTextSmall)}
            {renderBtn("x!", "func", "fact", "sci_func", null, styles.calcBtnTextSmall)}
          </View>
          <View style={dynamicSciStyle}>
            {renderBtn("log", "func", "log", "func", null, styles.calcBtnTextSmall)}
            {renderBtn("nPr", "sci", "nPr", "sci_func", null, styles.calcBtnTextSmall)}
            {renderBtn("nCr", "sci", "nCr", "sci_func", null, styles.calcBtnTextSmall)}
            {renderBtn("LCM", "sci", "LCM", "op", null, styles.calcBtnTextSmall)}
            {renderBtn("HCF", "sci", "HCF", "op", null, styles.calcBtnTextSmall)}
          </View>
        </>
      )}

      <View style={rowStyle}>
        {renderBtn("AC", "top", null, "clear", null, textStyle, handleEmergencyReset)}
        {renderBtn("⌫", "top", null, "delete", null, textStyle)}
        {renderBtn("%", "top", null, "percent", null, textStyle)}
        {renderBtn("/", "op", "/", "op", null, textStyle)}
      </View>
      <View style={rowStyle}>
        {renderBtn("7", "number", "7", "number", null, textStyle)}
        {renderBtn("8", "number", "8", "number", null, textStyle)}
        {renderBtn("9", "number", "9", "number", null, textStyle)}
        {renderBtn("×", "op", "*", "op", null, textStyle)}
      </View>
      <View style={rowStyle}>
        {renderBtn("4", "number", "4", "number", null, textStyle)}
        {renderBtn("5", "number", "5", "number", null, textStyle)}
        {renderBtn("6", "number", "6", "number", null, textStyle)}
        {renderBtn("-", "op", "-", "op", null, textStyle)}
      </View>
      <View style={rowStyle}>
        {renderBtn("1", "number", "1", "number", null, textStyle)}
        {renderBtn("2", "number", "2", "number", null, textStyle)}
        {renderBtn("3", "number", "3", "number", null, textStyle)}
        {renderBtn("+", "op", "+", "op", null, textStyle)}
      </View>
      <View style={rowStyle}>
        {renderBtn("0", "number", "0", "number", { flex: 2, aspectRatio: 'auto' }, textStyle)}
        {renderBtn(".", "number", ".", "number", null, textStyle)}
        {renderBtn("=", "equal", "=", "equal", null, textStyle)}
      </View>
    </>
  );
});

export default React.memo(function CalculatorComponent({ onSwitchMode, setIsHistoryOpen, themeProps }) {
  const { THEME, isDark, themePreference, toggleTheme } = themeProps;
  
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isLandscape = isWeb ? width > height : false;
  const isTablet = width > 768;

  const [display, setDisplay] = useState("0");
  const [history, setHistory] = useState("");
  const [newNumber, setNewNumber] = useState(true);
  const [calcMode, setCalcMode] = useState('basic');
  const [calcHistory, setCalcHistory] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [btnSize, setBtnSize] = useState('medium');
  const [degMode, setDegMode] = useState('deg');
  const [liveResult, setLiveResult] = useState("");
  const [cursorPos, setCursorPos] = useState(null);
  const [isSecond, setIsSecond] = useState(false);
  const isBasic = calcMode === 'basic';

  useEffect(() => {
    const loadBtnSize = async () => {
      try {
        const savedSize = await AsyncStorage.getItem(`btnSize_${calcMode}`);
        if (savedSize) setBtnSize(savedSize);
        else setBtnSize('medium');
      } catch (e) {}
    };
    loadBtnSize();
  }, [calcMode]);

  const updateBtnSize = async (size) => {
    setBtnSize(size);
    try {
      await AsyncStorage.setItem(`btnSize_${calcMode}`, size);
    } catch (e) {}
  };

  const flipAnim = useRef(new Animated.Value(0)).current;
  const frontInterpolate = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const backInterpolate = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });
  const displayScrollRef = useRef(null);

  useEffect(() => {
    if (displayScrollRef.current) {
      displayScrollRef.current.scrollToEnd({ animated: true });
    }
  }, [display]);

  const flipToHistory = () => {
    setIsFlipped(true);
    if (setIsHistoryOpen) setIsHistoryOpen(true);
    Animated.spring(flipAnim, { useNativeDriver: !isWeb, toValue: 1, friction: 8, tension: 10 }).start();
  };
  const flipToCalculator = () => {
    setIsFlipped(false);
    if (setIsHistoryOpen) setIsHistoryOpen(false);
    Animated.spring(flipAnim, { useNativeDriver: !isWeb, toValue: 0, friction: 8, tension: 10 }).start();
  };

  const displayRef = useRef(display);
  const newNumberRef = useRef(newNumber);
  const degModeRef = useRef(degMode);
  const cursorPosRef = useRef(cursorPos);

  useEffect(() => {
    displayRef.current = display;
    newNumberRef.current = newNumber;
    degModeRef.current = degMode;
    cursorPosRef.current = cursorPos;
  }, [display, newNumber, degMode, cursorPos]);

  const repeatOpRef = useRef(null);

  const handleDisplayTap = (event) => {
    if (event?.nativeEvent) {
      const { locationX, layout } = event.nativeEvent;
      const textWidth = layout?.width || 300;
      const totalChars = display.length || 1;
      const avgCharWidth = textWidth / totalChars;
      let estimatedIdx = Math.round(locationX / avgCharWidth);

      setCursorPos(Math.min(display.length, Math.max(0, estimatedIdx)));
      setNewNumber(false);
    }
  };

  const handlePress = useCallback(async (val, type) => {
    const currentDisplay = displayRef.current;
    const isNew = newNumberRef.current;
    const currentDegMode = degModeRef.current;
    const currentCursor = cursorPosRef.current === null ? currentDisplay.length : cursorPosRef.current;

    const setNewDisplay = (newStr, newCursor) => {
      setDisplay(newStr);
      setCursorPos(newCursor);
    };

    triggerHaptic('light');

    if (!isNew && type === 'number' && currentDisplay.length > 30) {
      return;
    }

    if (type === "clear") {
      setDisplay("0");
      setHistory("");
      setNewNumber(true);
      setCursorPos(null);
      return;
    }

    if (type === "delete") {
      if (currentDisplay === "Error" || currentDisplay === "Infinity" || currentDisplay === "NaN") {
        setNewDisplay("0", null);
        setNewNumber(true);
        return;
      }

      if (currentDisplay.length > 0) {
        if (currentCursor > 0) {
          const before = currentDisplay.slice(0, currentCursor - 1);
          const after = currentDisplay.slice(currentCursor);
          setNewDisplay((before + after) || "0", Math.max(0, currentCursor - 1));
        }
      } else {
        setNewDisplay("0", null);
        setNewNumber(true);
      }
      return;
    }

    const operators = ['+', '-', '*', '/', '%'];

    if (val === '.') {
      const charBefore = currentDisplay[currentCursor - 1] || "";
      const segmentsBefore = currentDisplay.slice(0, currentCursor).split(/[+\-*/%^()]/);
      const currentSegment = segmentsBefore[segmentsBefore.length - 1];

      if (currentSegment.includes('.')) return;

      const toInsert = (operators.includes(charBefore) || currentDisplay === "" || currentCursor === 0) ? "0." : ".";
      setNewDisplay(currentDisplay.slice(0, currentCursor) + toInsert + currentDisplay.slice(currentCursor), currentCursor + toInsert.length);
      setNewNumber(false);
      return;
    }

    if (type === "percent") {
      const charBefore = currentDisplay[currentCursor - 1] || "";
      if (operators.includes(charBefore)) return;
      setNewDisplay(currentDisplay.slice(0, currentCursor) + "%" + currentDisplay.slice(currentCursor), currentCursor + 1);
      setNewNumber(false);
      return;
    }

    if (type === "op" || type === "equal") {
      const charBefore = currentDisplay[currentCursor - 1] || "";
      const isOperatorBefore = operators.includes(charBefore);

      if (isOperatorBefore) {
        if (charBefore !== '%') {
          if (val === '-' && charBefore !== '-') {
            setNewDisplay(currentDisplay.slice(0, currentCursor) + val + currentDisplay.slice(currentCursor), currentCursor + 1);
            setNewNumber(false);
            return;
          }
          if (type === "op") {
            setNewDisplay(currentDisplay.slice(0, currentCursor - 1) + val + currentDisplay.slice(currentCursor), currentCursor);
            return;
          }
        }
      }

      if (type === "op") {
        setNewDisplay(currentDisplay.slice(0, currentCursor) + val + currentDisplay.slice(currentCursor), currentCursor + 1);
        setNewNumber(false);
      }

      if (type === "equal") {
        try {
          let expr = currentDisplay;

          if (isNew && repeatOpRef.current) {
            expr = currentDisplay + repeatOpRef.current;
          } else {
            const match = currentDisplay.match(/([+\-*/%])((?:[^-+\-*/%]|\(-)*)$/);
            if (match) {
              repeatOpRef.current = match[0];
            } else {
              repeatOpRef.current = null;
            }
          }

          const res = safeEvaluate(expr, currentDegMode);
          const resultStr = String(res);
          setNewDisplay(resultStr, null);

          setCalcHistory(prev => [
            { id: Date.now(), expression: expr, result: resultStr },
            ...prev
          ]);
          setNewNumber(true);
        } catch (e) {
          setNewDisplay("Error", null);
          setNewNumber(true);
        }
      }
      return;
    }

    if (type === 'func' || type === 'sci_func' || type === 'constant' || type === 'sci') {
      let baseDisplay = currentDisplay;
      let workingCursor = currentCursor;

      if (isNew) {
        baseDisplay = "";
        workingCursor = 0;
        setNewNumber(false);
      }

      let toInsert = val;
      if (type === 'func' || type === 'sci_func') {
        toInsert = val + "(";
      }

      const finalDisplay = (baseDisplay === "0" && val !== ".") ?
        toInsert + baseDisplay.slice(1) :
        baseDisplay.slice(0, workingCursor) + toInsert + baseDisplay.slice(workingCursor);

      const nextCursor = (baseDisplay === "0" && val !== ".") ? toInsert.length : workingCursor + toInsert.length;

      setNewDisplay(finalDisplay, nextCursor);
      return;
    }

    if (type === "number") {
      if (currentDisplay === "0" && val !== ".") {
        setNewDisplay(val, val.length);
      } else {
        if (isNew) {
          setNewDisplay(val, val.length);
        } else {
          setNewDisplay(currentDisplay.slice(0, currentCursor) + val + currentDisplay.slice(currentCursor), currentCursor + 1);
        }
      }
      setNewNumber(false);
    }
  }, []);

  const triggerHaptic = async (type) => {
    if (isWeb) return;
    try {
      if (type === 'light') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      if (type === 'light') Vibration.vibrate(10);
    }
  };

  const handleSettingsPress = () => {
    setShowSettings(true);
  };

  const switchMode = (mode) => {
    setCalcMode(mode);
    setShowSettings(false);
  };

  return (
    <View style={[styles.mobileGameContainer, { backgroundColor: THEME.bg }, isLandscape && { flexDirection: 'row' }]}>
      <Animated.View
        style={[
          { flex: 1, width: '100%', backfaceVisibility: 'hidden', justifyContent: 'flex-end', pointerEvents: isFlipped ? 'none' : 'auto' },
          { transform: [{ rotateY: frontInterpolate }] }
        ]}
      >
        <Pressable
          style={[styles.settingsButton, { left: 5, right: undefined, zIndex: 50, top: -5 }, isLandscape && { top: 10, left: 5 }]}
          onPress={flipToHistory}
          hitSlop={10}
        >
          <MaterialCommunityIcons name="history" size={isTablet ? 32 : 24} color={isDark ? "rgba(255,255,255,0.7)" : "rgba(15, 23, 42, 0.7)"} />
        </Pressable>

        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 45,
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 40,
            backgroundColor: 'transparent',
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
          }}
        >
          <View style={{ alignItems: 'center', paddingBottom: 15, paddingTop: 5, paddingHorizontal: 40 }}>
            <Text style={{
              textAlign: 'center',
              color: THEME.textAlt,
              fontSize: 14,
              fontFamily: 'Outfit_700Bold',
              letterSpacing: 1.5,
              opacity: 0.9
            }}>
              {calcMode === 'basic' ? 'BASIC MODE' : calcMode === 'sci' ? 'SCIENTIFIC MODE' : 'CAT EXAM MODE'}
            </Text>
          </View>
        </View>

        <Pressable
          style={[styles.settingsButton, isLandscape && { top: 10, left: undefined, right: 10 }]}
          onPress={(e) => {
            e?.stopPropagation?.();
            handleSettingsPress();
          }}
          hitSlop={10}
        >
          <Feather name="more-vertical" size={isTablet ? 32 : 24} color={isDark ? "rgba(255,255,255,0.7)" : "rgba(15, 23, 42, 0.7)"} />
        </Pressable>

        <Modal
          animationType="fade"
          transparent={true}
          visible={showSettings}
          onRequestClose={() => setShowSettings(false)}
        >
          <StatusBar style={isDark ? 'light' : 'dark'} />
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setShowSettings(false)}
          >
            <Pressable
              onPress={(e) => e.stopPropagation()}
              style={[
                styles.modalContent,
                isTablet && { width: 500 },
                {
                  backgroundColor: isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.4)',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)',
                  overflow: 'hidden',
                }
              ]}
            >
              {!isWeb && (
                <BlurView
                  intensity={50}
                  tint={isDark ? 'dark' : 'light'}
                  style={StyleSheet.absoluteFill}
                />
              )}
              <LinearGradient
                colors={isDark ? ['rgba(255, 255, 255, 0.05)', 'rgba(0, 0, 0, 0.2)'] : ['rgba(255, 255, 255, 0.4)', 'rgba(255, 255, 255, 0.1)']}
                style={StyleSheet.absoluteFill}
              />

              <Text style={[styles.modalTitle, { color: THEME.textMain, marginBottom: 8, fontSize: 16 }]}>Settings</Text>

              <Text style={[styles.modalButtonText, { color: THEME.textAlt, marginBottom: 6, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, fontWeight: '700' }]}>Mode</Text>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginBottom: 12 }}>
                {['basic', 'sci', 'cat'].map(mode => (
                  <Pressable
                    key={mode}
                    style={[styles.modalButton, {
                      width: '30%',
                      height: 32,
                      marginBottom: 0,
                      backgroundColor: calcMode === mode ? THEME.primary : (isDark ? '#121212' : '#F1F5F9'),
                      borderWidth: calcMode === mode ? 0 : 1,
                      borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
                    }]}
                    onPress={() => switchMode(mode)}
                  >
                    <Text style={[styles.modalButtonText, { fontSize: 12, color: calcMode === mode ? '#FFF' : (isDark ? '#F1F5F9' : '#0F172A') }]}>
                      {mode.toUpperCase()}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <Pressable
                  style={{ flexDirection: 'row', alignItems: 'center', padding: 4 }}
                  onPress={() => setShowAbout(true)}
                >
                  <Feather name="info" size={12} color={THEME.textAlt} style={{ marginRight: 4 }} />
                  <Text style={{ color: THEME.textAlt, fontSize: 11, fontWeight: '600' }}>About</Text>
                </Pressable>

                <Pressable
                  style={[styles.modalButton, styles.modalButtonCancel, { width: 80, height: 32, marginTop: 0, marginBottom: 0 }]}
                  onPress={() => setShowSettings(false)}
                >
                  <Text style={[styles.modalButtonText, styles.modalButtonCancelText, { fontSize: 12 }]}>Done</Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </Modal>

        <Modal
          animationType="fade"
          transparent={true}
          visible={showAbout}
          onRequestClose={() => setShowAbout(false)}
        >
          <Pressable
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' }}
            onPress={() => setShowAbout(false)}
          >
            <TouchableWithoutFeedback>
              <View style={{
                width: 300,
                backgroundColor: THEME.bg,
                borderRadius: 20,
                padding: 24,
                borderWidth: 1,
                borderColor: THEME.border,
                alignItems: 'center',
              }}>
                <View style={{ width: 60, height: 60, borderRadius: 18, backgroundColor: 'rgba(168, 85, 247, 0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
                  <Feather name="shield" size={32} color="#A855F7" />
                </View>
                <Text style={{ color: THEME.textMain, fontSize: 22, fontFamily: 'Outfit_700Bold', marginBottom: 4 }}>CalcX</Text>
                <Text style={{ color: THEME.textMain, textAlign: 'center', fontSize: 14, fontWeight: 'bold', marginBottom: 20 }}>Version 1.0.3</Text>
                <Pressable
                  style={{ backgroundColor: THEME.btnEqual[0], paddingVertical: 12, paddingHorizontal: 32, borderRadius: 24 }}
                  onPress={() => setShowAbout(false)}
                >
                  <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Close</Text>
                </Pressable>
              </View>
            </TouchableWithoutFeedback>
          </Pressable>
        </Modal>

        <View style={[
          isLandscape ? { flex: 1.2 } : { flex: 0.8 },
          {
            backgroundColor: THEME.bg,
            justifyContent: 'flex-end',
            paddingBottom: 60,
            paddingTop: 60,
          }
        ]}>
          <View style={{ height: 40, justifyContent: 'center', paddingHorizontal: 24, marginBottom: 8 }}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ alignItems: 'center', justifyContent: 'flex-end', flexGrow: 1 }}
            >
              <Text style={{
                color: THEME.textAlt,
                fontSize: 20,
                fontFamily: 'Inter_500Medium',
                opacity: 0.6
              }}>
                {history || liveResult || (display.length > 1 || display !== '0' ? display : '')}
              </Text>
            </ScrollView>
          </View>

          <View style={{ 
            height: 120, 
            justifyContent: 'center', 
            paddingHorizontal: 24, 
            marginBottom: 5,
            overflow: 'hidden',
            borderRadius: 24
          }}>
            <BlurView
              intensity={isDark ? 40 : 60}
              tint={isDark ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />

            <ScrollView
              ref={displayScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ alignItems: 'center', justifyContent: 'flex-end', flexGrow: 1 }}
              style={{ width: '100%' }}
            >
              <Pressable
                onPress={handleDisplayTap}
                style={{ flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: '100%', justifyContent: 'flex-end' }}
              >
                {renderHighlightedExpression(
                  display,
                  THEME,
                  isDark,
                  display.length > 15 ? 40 : display.length > 9 ? 55 : (isTablet ? 90 : 72),
                  cursorPos
                )}
              </Pressable>
            </ScrollView>
          </View>

          <View style={{
            height: 30,
            paddingHorizontal: 28,
            marginTop: -5,
            flexDirection: 'row',
            justifyContent: 'flex-end',
            alignItems: 'center'
          }}>
            <AnimatedGhostLine display={display} THEME={THEME} />
          </View>
        </View>

        <LinearGradient
          colors={THEME.keypadGradient}
          style={[
            styles.calcKeypad,
            {
              paddingHorizontal: 12,
              paddingTop: 16,
              marginTop: 0,
              gap: isBasic ? 8 : 4,
              zIndex: 0,
              borderTopWidth: 0,
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
              overflow: 'hidden',
            },
            isLandscape && { borderLeftWidth: 1, borderLeftColor: THEME.border, paddingBottom: 20 }
          ]}
        >
          <Keypad
            calcMode={calcMode}
            btnSize={btnSize}
            handlePress={handlePress}
            handleEmergencyReset={handleEmergencyReset}
            THEME={THEME}
            isTablet={isTablet}
            isDark={isDark}
            degMode={degMode}
            isSecond={isSecond}
            setIsSecond={setIsSecond}
          />

          <View style={{ padding: 10, paddingBottom: Math.max(insets.bottom, 20) + 10, marginTop: 5, alignItems: 'center', width: '100%' }}>
            <Text style={styles.calcFooter}>CALCX</Text>
          </View>
        </LinearGradient>
      </Animated.View>

      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { backfaceVisibility: 'hidden', backgroundColor: isDark ? '#000000' : THEME.bg, pointerEvents: isFlipped ? 'auto' : 'none' },
          { transform: [{ rotateY: backInterpolate }] }
        ]}
      >
        <View style={{ flex: 1 }}>
          <View style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 45,
            justifyContent: 'center',
            paddingLeft: 16,
            zIndex: 40,
            backgroundColor: 'transparent',
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
          }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: THEME.textMain, fontFamily: 'Outfit_700Bold', paddingBottom: 6 }}>History</Text>
          </View>
          <Pressable style={[styles.settingsButton, { top: -5, right: 10 }]} onPress={flipToCalculator} hitSlop={10}>
            <MaterialCommunityIcons name="close" size={28} color={THEME.textMain} />
          </Pressable>

          <View style={{ flex: 1, paddingTop: 41 }}>
            <View style={{
              position: 'absolute',
              top: 38 - 41,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: isDark ? '#000000' : 'rgba(255, 255, 255, 0.6)',
              zIndex: -1,
            }} />

            {calcHistory.length === 0 ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', opacity: 0.5, paddingHorizontal: 16 }}>
                <MaterialCommunityIcons name="history" size={64} color={THEME.textAlt} />
                <Text style={{ marginTop: 16, color: THEME.textAlt, fontFamily: 'Inter_500Medium' }}>No calculations yet</Text>
              </View>
            ) : (
              <FlatList
                data={calcHistory}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => {
                      setDisplay(String(item.result));
                      setNewNumber(true);
                      flipToCalculator();
                    }}
                    style={({ pressed }) => [{
                      paddingVertical: 12,
                      borderBottomWidth: 1,
                      borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                      alignItems: 'flex-start',
                      opacity: pressed ? 0.7 : 1
                    }]}
                  >
                    <Text style={{ fontSize: 12, color: THEME.textAlt, marginBottom: 2 }}>
                      {new Date(item.id).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </Text>
                    <Text style={{ fontSize: 16, color: THEME.textAlt, fontFamily: 'Inter_500Medium', marginBottom: 2 }}>{item.expression}</Text>
                    <Text style={{ fontSize: 24, color: THEME.btnEqual[1], fontFamily: 'Outfit_700Bold' }}>= {item.result}</Text>
                  </Pressable>
                )}
                contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 16 }}
                showsVerticalScrollIndicator={false}
              />
            )}

            {calcHistory.length > 0 && (
              <Pressable
                style={({ pressed }) => ({
                  position: 'absolute',
                  bottom: Math.max(insets.bottom, 12) + 4,
                  alignSelf: 'center',
                  borderRadius: 20,
                  overflow: 'hidden',
                  borderWidth: 1,
                  borderColor: 'rgba(239,68,68,0.20)',
                  transform: [{ scale: pressed ? 0.97 : 1 }],
                })}
                onPress={() => {
                  setCalcHistory([]);
                  flipToCalculator();
                }}
              >
                <LinearGradient
                  colors={isDark ? ['rgba(239,68,68,0.08)', 'rgba(185,28,28,0.04)'] : ['rgba(239,68,68,0.08)', 'rgba(185,28,28,0.03)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingVertical: 14,
                    paddingHorizontal: 28,
                    gap: 10,
                    backgroundColor: 'transparent',
                  }}
                >
                  <MaterialCommunityIcons name="trash-can-outline" size={18} color="#ef4444" />
                  <Text style={{
                    color: '#ef4444',
                    fontWeight: '700',
                    fontFamily: 'Inter_600SemiBold',
                    fontSize: 13,
                    letterSpacing: 1.8,
                  }}>CLEAR HISTORY</Text>
                </LinearGradient>
              </Pressable>
            )}
          </View>
        </View>
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  mobileGameContainer: {
    flex: 1,
    padding: 0,
    justifyContent: 'flex-end',
    width: '100%',
  },
  settingsButton: {
    position: 'absolute',
    top: -5,
    right: 10,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    zIndex: 50,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    maxWidth: 340,
    padding: 12,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Outfit_700Bold',
    color: '#F8FAFC',
    marginBottom: 8,
  },
  modalButton: {
    width: '100%',
    paddingVertical: 8,
    backgroundColor: '#334155',
    alignItems: 'center',
    marginBottom: 6,
  },
  modalButtonText: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '600',
  },
  modalButtonCancel: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: '#ed293dff',
    marginTop: 8,
  },
  modalButtonCancelText: {
    color: '#ca0d0dff',
  },
  themeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#475569',
    borderRadius: 8,
  },
  themeOptionText: {
    fontSize: 12,
    fontWeight: '700',
  },
  calcKeypad: {
    width: '100%',
    backgroundColor: '#000000',
    borderTopWidth: 0,
    borderTopColor: '#334155',
    paddingTop: 20,
    paddingHorizontal: 12,
    gap: 8,
    justifyContent: 'flex-end',
    paddingBottom: 10,
    borderRadius: 20,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
  calcRow: {
    flexDirection: 'row',
    gap: 6,
    width: '100%',
    height: 68,
    alignItems: 'center',
  },
  calcRowDense: {
    flexDirection: 'row',
    gap: 4,
    width: '100%',
    height: 46,
    alignItems: 'center',
  },
  calcBtnTextDense: {
    fontSize: 20,
    fontFamily: 'Inter_600SemiBold',
  },
  calcBtn: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 40,
    zIndex: 1,
  },
  calcBtnText: {
    fontSize: 24,
    fontFamily: 'Inter_600SemiBold',
  },
  calcBtnTextSmall: {
    fontSize: 18,
    fontFamily: 'Inter_500Medium',
  },
  calcFooter: {
    color: '#A855F7',
    fontSize: 14,
    fontWeight: '900',
    fontFamily: isIOS ? 'Avenir-Heavy' : 'sans-serif-condensed',
    textAlign: 'center',
    marginTop: 10,
    paddingBottom: 0,
    letterSpacing: 6,
    textTransform: 'uppercase',
    opacity: 0.9,
  },
});
