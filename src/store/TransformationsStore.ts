import {create} from 'zustand'
import {Transformation, TransformationTypes} from "@/types";

interface TransformationsStoreState {
    transformations: Transformation[];
    addTransformation: (transformation: Transformation) => void;
    removeTransformation: (transformationType: TransformationTypes) => void;
    isTransformComplete: boolean;
    setIsTransformComplete: (value: boolean) => void;
}

export const useTransformationsStore = create<TransformationsStoreState>()((set) => ({
    transformations: [],
    addTransformation: (transformation: Transformation) => set((state) => ({
        transformations: [...state.transformations, transformation]
    })),
    removeTransformation: (transformationType: TransformationTypes) => set((state) => ({
        transformations: state.transformations.filter(tr => tr.type !== transformationType)
    })),
    isTransformComplete: false,
    setIsTransformComplete: (value: boolean) => set(() => ({isTransformComplete: value})),
}));