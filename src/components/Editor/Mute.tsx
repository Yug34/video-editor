import {Toggle} from "@/components/ui/toggle";
import {SpeakerOffIcon} from "@radix-ui/react-icons";
import {useTransformationsStore} from "@/store";

export const Mute = () => {
    const {addTransformation, removeTransformation} = useTransformationsStore();

    return (
        <Toggle
            aria-label="Toggle Video Grayscale"
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