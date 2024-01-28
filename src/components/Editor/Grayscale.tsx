import {Toggle} from "@/components/ui/toggle";
import {MaskOnIcon} from "@radix-ui/react-icons";
import {useTransformationsStore} from "@/store";

export const Grayscale = () => {
    const {addTransformation, removeTransformation} = useTransformationsStore();

    return (
        <Toggle
            aria-label="Toggle Video Grayscale"
            onPressedChange={(pressed: boolean) => {
                if (pressed) {
                    addTransformation({type: "Grayscale"});
                } else {
                    removeTransformation("Grayscale");
                }
            }}
        >
            Grayscale
            <MaskOnIcon className={"ml-3"}/>
        </Toggle>
    )
}