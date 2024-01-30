import {Toggle} from "@/components/ui/toggle";
import {MaskOnIcon} from "@radix-ui/react-icons";
import {useTransformationsStore} from "@/store/TransformationsStore";

export const Grayscale = () => {
    const {
        addTransformation,
        removeTransformation,
        checkForTransformationType,
        transformations
    } = useTransformationsStore();

    return (
        <Toggle
            aria-label="Toggle Video Grayscale"
            pressed={checkForTransformationType("Grayscale", transformations)}
            onPressedChange={() => {
                if (checkForTransformationType("Grayscale", transformations)) {
                    removeTransformation("Grayscale");
                } else {
                    addTransformation({type: "Grayscale"});
                }
            }}
        >
            Grayscale
            <MaskOnIcon className={"ml-3"}/>
        </Toggle>
    )
}