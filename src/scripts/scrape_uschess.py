import urllib.request
import re
import json
import time

def get_links(page_num):
    url = f"https://www.uschess.org/index.php?option=com_remository&Itemid=486&func=select&id=8&orderby=4&page={page_num}"
    print(f"Fetching page {page_num}...")
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'})
    try:
        with urllib.request.urlopen(req) as response:
            html = response.read().decode('utf-8', errors='ignore')
            
            # The user said: 'td[align=right] a'
            # We want to find cases where a <td> has align="right" and contains an <a> tag.
            # Example: <td align="right"><a href="...">Download</a></td>
            
            # Matches: <td align="right"><a ... href="LINK" ...>
            # We also want the title which is usually in a previous cell or header.
            # In the content.md, it looked like:
            # ### [Title](linkinfo)[Download](linkdown)
            
            # Let's try to match the pattern:
            # <td>...<a href="...func=fileinfo...">TITLE</a>...</td><td align="right"><a href="...func=startdown&id=ID...">Download</a></td>
            
            # Simplified regex based on user input:
            # Finding <a> tags inside <td align="right">
            
            matches = re.finditer(r'<td[^>]*align=["\']right["\'][^>]*>\s*<a[^>]*href=["\']([^"\']+)["\'][^>]*>', html, re.IGNORECASE)
            
            links = []
            for match in matches:
                link = match.group(1)
                if 'func=startdown' in link:
                    # Try to find a title before this match
                    # Titles are often in <a> tags with func=fileinfo
                    start_pos = match.start()
                    # Look back 500 chars for a title
                    context = html[max(0, start_pos-1000):start_pos]
                    title_match = re.findall(r'<a[^>]*func=fileinfo[^>]*>([^<]+)</a>', context, re.IGNORECASE)
                    title = title_match[-1].strip() if title_match else "Unknown"
                    
                    links.append({
                        "title": title,
                        "url": ("https://www.uschess.org" + link if link.startswith('/') else link).replace('&amp;', '&')
                    })
            return links
    except Exception as e:
        print(f"Error fetching page {page_num}: {e}")
        return []

def main():
    all_links = []
    # Based on the HTML, there are at least 20 pages
    for i in range(1, 26): # Increase range to capture all potential pages
        links = get_links(i)
        if not links:
            break
        all_links.extend(links)
        time.sleep(1) # Be nice
    
    output_file = "uschess_links.json"
    with open(output_file, "w") as f:
        json.dump(all_links, f, indent=2)
    
    print(f"Saved {len(all_links)} links to {output_file}")

if __name__ == "__main__":
    main()
