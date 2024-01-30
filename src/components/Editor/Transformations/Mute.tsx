import {Toggle} from "@/components/ui/toggle";
import {SpeakerOffIcon} from "@radix-ui/react-icons";
import {useTransformationsStore} from "@/store/TransformationsStore";

export const Mute = () => {
    const {
        addTransformation,
        removeTransformation,
        checkForTransformationType,
        transformations
    } = useTransformationsStore();

    return (
        <Toggle
            className={"w-full"}
            aria-label="Toggle Video Grayscale"
            pressed={checkForTransformationType("Mute", transformations)}
            onPressedChange={(pressed: boolean) => {
                if (pressed) {
                    addTransformation({type: "Mute"});
                } else {
                    removeTransformation("Mute");
                }
            }}
        >
            Mute
            <SpeakerOffIcon className={"ml-3"}/>
        </Toggle>
    )
}