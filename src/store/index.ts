import {create} from 'zustand'
import {Transformation, TransformationTypes} from "@/types";

interface TransformationsStoreState {
    transformations: Transformation[]
    addTransformation: (transformation: Transformation) => void
    removeTransformation: (transformationType: TransformationTypes) => void
}

export const useTransformationsStore = create<TransformationsStoreState>()((set) => ({
    transformations: [],
    addTransformation: (transformation: Transformation) => set((state) => ({
        ...state,
        transformations: [...state.transformations, transformation]
    })),
    removeTransformation: (transformationType: TransformationTypes) => set((state) => ({
        ...state,
        transformations: state.transformations.filter(tr => tr.type !== transformationType)
    }))
}));