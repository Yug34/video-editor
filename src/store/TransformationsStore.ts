import {create} from 'zustand'
import {Transformation, TransformationTypes} from "@/types";

interface TransformationsStoreState {
    transformations: Transformation[];
    addTransformation: (transformation: Transformation) => void;
    removeTransformation: (transformationType: TransformationTypes) => void;
    clearTransformations: () => void;
    isTransformComplete: boolean;
    setIsTransformComplete: (value: boolean) => void;
    checkForTransformationType: (transformationType: TransformationTypes, transformations: Transformation[]) => boolean;
}

export const useTransformationsStore = create<TransformationsStoreState>()((set) => ({
    transformations: [],
    addTransformation: (transformation: Transformation) => set((state) => ({
        transformations: [...state.transformations, transformation]
    })),
    removeTransformation: (transformationType: TransformationTypes) => set((state) => ({
        transformations: state.transformations.filter(tr => tr.type !== transformationType)
    })),
    clearTransformations: () => set(() => ({
        transformations: []
    })),
    isTransformComplete: false,
    setIsTransformComplete: (value: boolean) => set(() => ({isTransformComplete: value})),
    checkForTransformationType: (transformationType: TransformationTypes, transformations: Transformation[]) => {
        for (const transformation of transformations) {
            if (transformation.type === transformationType) {
                return true;
            }
        }

        return false;
    }
}));