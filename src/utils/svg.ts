import { ISVGElementAttr } from "@/types/svg";
import getStroke, { StrokeOptions } from "perfect-freehand";

export const svgns = "http://www.w3.org/2000/svg";

/**
 * 生成随机码
 * @param len 随机码长度
 */
export const createRandomCode = (len = 6) => {
    const charset =
        "_0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    const maxLen = charset.length;
    let ret = "";
    for (let i = 0; i < len; i++) {
        const randomIndex = Math.floor(Math.random() * maxLen);
        ret += charset[randomIndex];
    }
    return ret;
};

export const transformPoint = (x: number, y: number, m: DOMMatrix) => {
    return { x: m.a * x + m.c * y + m.e, y: m.b * x + m.d * y + m.f };
};

const TO_FIXED_PRECISION = /(\s?[A-Z]?,?-?[0-9]*\.[0-9]{0,2})(([0-9]|e|-)*)/g;
function med(A: number[], B: number[]) {
    return [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
}

const pathsCache = new WeakMap<number[][], string>([]);

/**
 * 处理笔记转化为svg path
 * @param points
 * @returns
 */
 export const getPenSvgPath = (points: number[][], lineWidth: number) => {
    let path = pathsCache.get(points);
    if (path) return path;
    const options: StrokeOptions = {
        simulatePressure: true, // 是否基于速度模拟压力
        size: lineWidth,
        thinning: 0.6,
        smoothing: 0.5,
        streamline: 0.5,
        easing: (t) => Math.sin((t * Math.PI) / 2),
        last: false
    };
    const storkePoints = getStroke(points, options);
    const max = storkePoints.length - 1;
    path = storkePoints
        .reduce(
            (acc, point, i, arr) => {
                if (i === max) {
                    acc.push(point, med(point, arr[0]), "L", arr[0], "Z");
                } else {
                    acc.push(point, med(point, arr[i + 1]));
                }
                return acc;
            },
            ["M", storkePoints[0], "Q"]
        )
        .join(" ")
        .replace(TO_FIXED_PRECISION, "$1");
    pathsCache.set(points, path);
    return path;
};

export const assignAttributes = (node: SVGGElement, attrs: ISVGElementAttr) => {
    for (const key in attrs) {
        node.setAttribute(key, attrs[key].toString());
    }
};

// throttle callback to execute once per animation frame
export const throttleRAF = <T extends unknown[]>(fn: (...args: T) => void) => {
    let handle: number | null = null;
    let lastArgs: T | null = null;
    let callback: ((...args: T) => void) | null = null;
    const ret = (...args: T) => {
        if (process.env.NODE_ENV === "test") {
            fn(...args);
            return;
        }
        lastArgs = args;
        callback = fn;
        if (handle === null) {
            handle = window.requestAnimationFrame(() => {
                handle = null;
                lastArgs = null;
                callback = null;
                fn(...args);
            });
        }
    };
    ret.flush = () => {
        if (handle !== null) {
            cancelAnimationFrame(handle);
            handle = null;
        }
        if (lastArgs) {
            const _lastArgs = lastArgs;
            const _callback = callback;
            lastArgs = null;
            callback = null;
            if (_callback !== null) {
                _callback(..._lastArgs);
            }
        }
    };
    ret.cancel = () => {
        lastArgs = null;
        callback = null;
        if (handle !== null) {
            cancelAnimationFrame(handle);
            handle = null;
        }
    };
    return ret;
};
