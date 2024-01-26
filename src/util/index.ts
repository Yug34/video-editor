import {Format} from "@/types";
import {FORMATS} from "@/constants";

declare const __type: unique symbol;

export type Nominal<Identifier, Type> = Type & {
    readonly [__type]: Identifier;
};

export const roundFloat = (num: number) => (Math.round(num * 100) / 100).toFixed(2);

export const isVideoFormatBrowserCompatible = (videoFormat: Format): boolean => {
    return FORMATS[videoFormat].isPlayable;
}

export const px2vw = (size: number, width: number = 1920) =>
    `${(size / width) * 100}vw`;
export const px2vh = (size: number, height: number = 1080) =>
    `${(size / height) * 100}vh`;