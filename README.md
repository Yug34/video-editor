# Client-sided video editor

A video editor that lets you edit your videos on the client-side.

Made with `FFmpeg.wasm` and `shadcn/ui`.

> [!NOTE]
> The formats `.wmv` and `.avi` are not playable by browsers. So the editor does work, but won't be able to display the
> result. You can still download the results of the process as normal.

## Features:

- Fully client-side video editing
- Converting and encoding the video into other formats/encodings
- Trimming video
- Muting audio from a video
- Grayscaling
- TODOs:
    - Compress video
    - Add custom audio
    - Slow motion / timelapse video

### Formats and Codecs supported:

- MP4: with codecs `h264` and `mpeg4`
- WebM: with codec `vp8`
- AVI: with codecs `h264` and `mpeg4`
- MOV: with codecs `h264` and `mpeg4`
- WMV (Windows Media Video)

## Core components of this project:

- `Editor.tsx`: Handles taking in the video as a file input, and manages the state of the application.
    - Main state variable is `transformations: Transformation[]`. The following is the `Transformation` type. Reading
      this will probably let your intuition figure out the core logic of the application.
        - ```typescript
            type TransformationTypes = "Convert" | "Grayscale" | "Trim" | "Mute" | "Compress";
        
            type Transformation = {
                type: TransformationTypes;
                transcode?: {
                    to: Format;
                    codec: Codec;
                }
                trim?: {
                    from: VideoDuration;
                    to: VideoDuration;
                }
            }
          ```

# Locally hosting:

```sh
bun i && bun start
# OR
pnpm i && pnpm start
# OR
pnpm i && pnpm start
```
