export interface ISVGElementAttr {
    fill: string;
    opacity: number;
    style: string;
    [key: string]: string | number;
}

export interface ISVGElement {
    element: "path";
    id: string;
    points: number[][];
    strokeWidth: number;
    strokeColor: string;
    attr: ISVGElementAttr;
}
