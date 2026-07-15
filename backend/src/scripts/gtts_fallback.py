import io
import sys


def main() -> int:
    if len(sys.argv) < 2:
        print("Output path is required.", file=sys.stderr)
        return 1

    output_path = sys.argv[1]
    text = sys.stdin.read().strip()

    if not text:
        print("Text is required for gTTS fallback.", file=sys.stderr)
        return 1

    try:
        from gtts import gTTS
    except Exception as exc:  # pragma: no cover
        print(f"gTTS dependency is unavailable: {exc}", file=sys.stderr)
        return 1

    try:
        mp3_buffer = io.BytesIO()
        tts = gTTS(text=text, lang="en", tld="co.uk")
        tts.write_to_fp(mp3_buffer)
        mp3_buffer.seek(0)

        with open(output_path, "wb") as file_handle:
            file_handle.write(mp3_buffer.read())
    except Exception as exc:  # pragma: no cover
        print(f"gTTS synthesis failed: {exc}", file=sys.stderr)
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
