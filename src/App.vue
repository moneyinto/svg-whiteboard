<template>
    <div class="white-board-box">
        <div
            class="svg-container pen"
            @mousedown="drawStart"
            @mousemove="drawing"
            @mouseup="drawEnd"
            @mouseout="drawEnd"
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                xmlnsXlink="http://www.w3.org/1999/xlink"
                version="1.1"
                width="100%"
                height="100%"
            >
                <g ref="pathRef"></g>
            </svg>
        </div>
        <div class="white-board-tools">
            <div class="tool-btn" @click="setStrokeWidth('add')">粗</div>
            <div class="tool-btn" @click="setStrokeWidth('reduce')">细</div>
            <div class="color-btn red" @click="setStrokeColor('#f6000')"></div>
            <div class="color-btn green" @click="setStrokeColor('#21f600')"></div>
            <div class="color-btn blue" @click="setStrokeColor('#3100f6')"></div>
            <div class="color-btn black" @click="setStrokeColor('#000000')"></div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, nextTick, ref } from "vue";
import { ISVGElement } from "./types/svg";
import {
    assignAttributes,
    createRandomCode,
    getPenSvgPath,
    svgns,
    throttleRAF,
    transformPoint
} from "./utils/svg";

export default defineComponent({
    name: "App",
    setup() {
        const pathRef = ref<SVGGElement>();
        const canDrawing = ref(false);
        const svgElements: ISVGElement[] = [];
        const strokeColor = ref("#f60000");
        const strokeWidth = ref(10);
        const svgMatrix = ref<DOMMatrix>();
        let targetSvgElement: ISVGElement | undefined;

        nextTick(() => {
            svgMatrix.value = pathRef.value?.getScreenCTM()?.inverse();
        });

        const createSvgElement = (point: number[]) => {
            const id = createRandomCode();
            const svgElement: ISVGElement = {
                element: "path",
                points: [point],
                id,
                strokeWidth: strokeWidth.value,
                strokeColor: strokeColor.value,
                attr: {
                    fill: strokeColor.value,
                    opacity: 1,
                    style: "pointer-events: none"
                }
            };
            svgElements.push(svgElement);
            return svgElement;
        };

        const updateSvgElement = (point: number[]) => {
            if (!targetSvgElement) return;
            const points = targetSvgElement.points;
            targetSvgElement.points = [...points, point];
        };

        const renderSvgElement = (svgElement: ISVGElement) => {
            const path = getPenSvgPath(
                svgElement.points,
                strokeWidth.value
            );

            let shape: SVGPathElement | null | undefined = pathRef.value?.querySelector(`[id='${svgElement.id}']`);
            if (shape) {
                shape.setAttributeNS(null, "d", path);
            } else {
                shape = document.createElementNS(svgns, svgElement.element);
                pathRef.value?.appendChild(shape);
                assignAttributes(shape, {
                    ...svgElement.attr,
                    id: svgElement.id,
                    d: path
                });
            }
        };

        const drawStart = (evt: MouseEvent) => {
            canDrawing.value = true;
            if (!svgMatrix.value) return (canDrawing.value = false);
            const point = transformPoint(evt.pageX, evt.pageY, svgMatrix.value);
            targetSvgElement = createSvgElement([point.x, point.y]);
        };

        const drawing = throttleRAF((evt: MouseEvent) => {
            if (canDrawing.value && targetSvgElement && svgMatrix.value) {
                const point = transformPoint(
                    evt.pageX,
                    evt.pageY,
                    svgMatrix.value
                );
                updateSvgElement([point.x, point.y]);
                renderSvgElement(targetSvgElement);
            }
        });

        const drawEnd = () => {
            canDrawing.value = false;
            if (targetSvgElement) {
                renderSvgElement(targetSvgElement);
            }
            targetSvgElement = undefined;
        };

        const setStrokeWidth = (type: "reduce" | "add") => {
            if (type === "reduce") {
                if (strokeWidth.value === 2) return;
                strokeWidth.value-=4;
            } else {
                strokeWidth.value+=4;
            }
        };

        const setStrokeColor = (color: string) => {
            strokeColor.value = color;
        };

        return {
            pathRef,
            drawStart,
            drawing,
            drawEnd,
            setStrokeWidth,
            setStrokeColor
        };
    }
});
</script>

<style>
body {
    margin: 0;
}

.white-board-box {
    height: 100vh;
    display: flex;
    flex-direction: column;
}

.white-board-tools {
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.tool-btn {
    width: 50px;
    border-radius: 4px;
    padding: 5px 10px;
    color: #666;
    border: 1px solid #aaa;
    cursor: pointer;
    margin-right: 10px;
    text-align: center;
    box-shadow: 0px 0px 12px rgba(0, 0, 0, .1);;
}

.tool-btn:hover, .color-btn:hover {
    opacity: 0.7;
}

.color-btn {
    width: 50px;
    border-radius: 4px;
    padding: 5px 10px;
    height: 34px;
    box-sizing: border-box;
    cursor: pointer;
    box-shadow: 0px 0px 12px rgba(0, 0, 0, .1);
    margin-right: 10px;
}

.color-btn.red {
    background: #f60000;
}

.color-btn.green {
    background: #21f600;
}

.color-btn.blue {
    background: #3100f6;
}

.color-btn.black {
    background: #000000;
}

.svg-container {
    flex: 1;
}

.pen {
    cursor: crosshair;
}
</style>
