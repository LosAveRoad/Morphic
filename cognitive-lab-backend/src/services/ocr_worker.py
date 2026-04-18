import sys
import json
import logging
import os
from paddleocr import PaddleOCR

# Disable paddleocr logging
logging.disable(logging.DEBUG)
os.environ['KMP_DUPLICATE_OK'] = 'True'

def main():
    try:
        if len(sys.argv) < 2:
            print(json.dumps({"success": False, "error": "No image path provided"}))
            return

        image_path = sys.argv[1]
        if not os.path.exists(image_path):
            print(json.dumps({"success": False, "error": "Image file not found"}))
            return

        # Initialize OCR
        ocr = PaddleOCR(use_textline_orientation=True, lang="ch")
        result = ocr.predict(image_path)
        
        text_lines = []
        if result:
            for res in result:
                for text in res.get('rec_texts', []):
                    text_lines.append(text)

        print(json.dumps({"success": True, "text": "\n".join(text_lines)}))

    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))

if __name__ == "__main__":
    main()
