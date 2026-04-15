import json
import os
import urllib.request
import time
import re

def download_file(url, target_path):
    print(f"Downloading {url} to {target_path}...")
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'})
    try:
        with urllib.request.urlopen(req) as response:
            # Check if it's a redirect or what the actual filename is in the headers
            final_url = response.geturl()
            content = response.read()
            
            # If target_path doesn't have an extension, try to guess or use .pgn as default
            if not os.path.splitext(target_path)[1]:
                # Try to get extension from final_url or headers
                if '.zip' in final_url.lower():
                    target_path += '.zip'
                else:
                    target_path += '.pgn'
            
            with open(target_path, 'wb') as f:
                f.write(content)
            return target_path
    except Exception as e:
        print(f"Error downloading {url}: {e}")
        return None

def sanitize_filename(filename):
    return re.sub(r'[\\/*?:"<>|]', "", filename).replace(" ", "_").strip()

def main():
    json_file = "uschess_links.json"
    if not os.path.exists(json_file):
        print(f"Error: {json_file} not found.")
        return

    with open(json_file, "r") as f:
        links = json.load(f)

    target_dir = "public/libraries/uschess"
    os.makedirs(target_dir, exist_ok=True)

    success_count = 0
    for entry in links:
        title = entry.get("title", "Unknown")
        url = entry.get("url")
        
        safe_title = sanitize_filename(title)
        base_path = os.path.join(target_dir, safe_title)
        if os.path.exists(base_path + ".pgn") or os.path.exists(base_path + ".zip"):
            # Still count it as success if it exists
            print(f"Skipping {title}, already exists.")
            success_count += 1
            continue

        result = download_file(url, base_path)
        if result:
            success_count += 1
            time.sleep(0.5) # Be a bit faster but still nice
        
    print(f"Downloaded {success_count} files. Now packaging into ZIP...")
    
    zip_path = "public/libraries/USChessLifeMagazine.zip"
    import zipfile
    with zipfile.ZipFile(zip_path, 'w') as zipf:
        for root, dirs, files in os.walk(target_dir):
            for file in files:
                zipf.write(os.path.join(root, file), file)
    
    print(f"Archive created at {zip_path}")
    print(f"Done! Successfully processed {success_count} files.")

if __name__ == "__main__":
    main()
