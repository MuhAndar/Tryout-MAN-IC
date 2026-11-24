import pypdf
import re
import json
import os

pdf_path = 'EBOOK_MAN_IC_5_PAKET_1300 SOAL--.pdf'
output_dir = 'data'
os.makedirs(output_dir, exist_ok=True)

reader = pypdf.PdfReader(pdf_path)
total_pages = len(reader.pages)
print(f"Total PDF pages: {total_pages}")

# Define package page ranges (1-indexed pages from Table of Contents)
# Soal ranges
soal_ranges = [
    (1, 4, 73),
    (2, 74, 143),
    (3, 144, 214),
    (4, 215, 285),
    (5, 286, 362),
]

# Pembahasan ranges
pemb_ranges = [
    (1, 363, 541),
    (2, 542, 721),
    (3, 722, 901),
    (4, 902, 1081),
    (5, 1082, 1262),
]

CATEGORIES = [
    (1, 40, "Kemampuan Verbal"),
    (41, 66, "Literasi Bahasa Indonesia"),
    (67, 86, "Bahasa Inggris"),
    (87, 111, "Keislaman"),
    (112, 169, "Matematika"),
    (170, 239, "Moderasi Beragama dan Sikap"),
    (240, 274, "Angket Sikap"),
]

def get_category_by_num(num):
    for start, end, cat in CATEGORIES:
        if start <= num <= end:
            return cat
    return "Umum"

def clean_page_text(txt):
    if not txt:
        return ""
    # Remove header
    txt = re.sub(r'MAN IC\s+\|\s+5 PAKET\s*\n\s*Halaman \d+\s*\n?', '', txt)
    return txt

all_packages_summary = []

for paket_idx in range(5):
    pkt_num, s_start, s_end = soal_ranges[paket_idx]
    _, p_start, p_end = pemb_ranges[paket_idx]
    
    print(f"\n--- Extracting Paket {pkt_num} (Soal: p{s_start}-p{s_end}, Pembahasan: p{p_start}-p{p_end}) ---")
    
    # 1. Extract Soal text
    soal_pages_text = []
    for p in range(s_start - 1, s_end):
        t = clean_page_text(reader.pages[p].extract_text() or '')
        soal_pages_text.append(t)
    soal_full_text = "\n".join(soal_pages_text)
    
    soal_blocks = re.split(r'\n(?=Soal \d+\b)', soal_full_text)
    questions_dict = {}
    
    for block in soal_blocks:
        b_strip = block.strip()
        lines = [l.strip() for l in b_strip.split('\n') if l.strip()]
        if not lines:
            continue
        
        # Match Soal X
        soal_num = None
        start_idx = 0
        for idx, line in enumerate(lines[:4]):
            m = re.match(r'^Soal\s+(\d+)\b', line)
            if m:
                soal_num = int(m.group(1))
                start_idx = idx + 1
                break
        
        if soal_num is None:
            continue
            
        content_lines = lines[start_idx:]
        q_lines = []
        options = {}
        curr_opt = None
        
        for l in content_lines:
            opt_m = re.match(r'^([A-E])\.\s*(.*)', l)
            if opt_m:
                curr_opt = opt_m.group(1)
                options[curr_opt] = opt_m.group(2).strip()
            elif curr_opt:
                options[curr_opt] += " " + l.strip()
            else:
                q_lines.append(l.strip())
                
        questions_dict[soal_num] = {
            'number': soal_num,
            'category': get_category_by_num(soal_num),
            'question': " ".join(q_lines).strip(),
            'options': options
        }
    
    # 2. Extract Pembahasan text
    pemb_pages_text = []
    for p in range(p_start - 1, min(p_end, total_pages)):
        t = clean_page_text(reader.pages[p].extract_text() or '')
        pemb_pages_text.append(t)
    pemb_full_text = "\n".join(pemb_pages_text)
    
    pemb_blocks = re.split(r'\n(?=Pembahasan Soal \d+\b)', pemb_full_text)
    pemb_dict = {}
    
    for block in pemb_blocks:
        b_strip = block.strip()
        m = re.match(r'^Pembahasan Soal\s+(\d+)\b', b_strip)
        if not m:
            continue
        soal_num = int(m.group(1))
        
        # Match key
        key_m = re.search(r'Kunci Jawaban:\s*([A-E])', b_strip)
        key = key_m.group(1) if key_m else ""
        
        # Extract explanation
        lines = b_strip.split('\n')
        key_line_idx = -1
        for idx, l in enumerate(lines):
            if 'Kunci Jawaban:' in l:
                key_line_idx = idx
                break
                
        if key_line_idx != -1:
            raw_explanation = "\n".join(lines[key_line_idx+1:]).strip()
        else:
            raw_explanation = "\n".join(lines[1:]).strip()
            
        pemb_dict[soal_num] = {
            'key': key,
            'explanation': raw_explanation
        }
        
    print(f"Paket {pkt_num}: Questions found = {len(questions_dict)}, Pembahasan found = {len(pemb_dict)}")
    
    # Combine questions and pembahasans
    combined_questions = []
    all_numbers = sorted(set(list(questions_dict.keys()) + list(pemb_dict.keys())))
    
    missing_keys_count = 0
    for num in all_numbers:
        q_data = questions_dict.get(num, {
            'number': num,
            'category': get_category_by_num(num),
            'question': '',
            'options': {}
        })
        p_data = pemb_dict.get(num, {
            'key': '',
            'explanation': ''
        })
        
        if not p_data['key']:
            missing_keys_count += 1
            
        combined_questions.append({
            'id': f"P{pkt_num}_{num}",
            'number': num,
            'category': q_data['category'],
            'question': q_data['question'],
            'options': q_data['options'],
            'answerKey': p_data['key'],
            'explanation': p_data['explanation']
        })
        
    # Write to paket JSON
    out_file = os.path.join(output_dir, f"paket{pkt_num}.json")
    with open(out_file, 'w', encoding='utf-8') as f:
        json.dump({
            'packageId': pkt_num,
            'packageName': f"Paket {pkt_num} MAN IC",
            'totalQuestions': len(combined_questions),
            'categories': {cat: sum(1 for q in combined_questions if q['category'] == cat) for _, _, cat in CATEGORIES},
            'questions': combined_questions
        }, f, ensure_ascii=False, indent=2)
        
    print(f"Saved {out_file} (Total: {len(combined_questions)}, Missing keys: {missing_keys_count})")
    
    all_packages_summary.append({
        'packageId': pkt_num,
        'packageName': f"Paket {pkt_num} MAN IC",
        'file': f"paket{pkt_num}.json",
        'totalQuestions': len(combined_questions),
        'categoryDistribution': {cat: sum(1 for q in combined_questions if q['category'] == cat) for _, _, cat in CATEGORIES}
    })

# Write summary manifest
summary_path = os.path.join(output_dir, "summary.json")
with open(summary_path, 'w', encoding='utf-8') as f:
    json.dump({
        'title': 'Bank Soal Ebook MAN IC 5 Paket 1300+ Soal',
        'totalPackages': len(all_packages_summary),
        'packages': all_packages_summary,
        'categories': [cat for _, _, cat in CATEGORIES]
    }, f, ensure_ascii=False, indent=2)

print("\nAll packages extracted successfully!")
