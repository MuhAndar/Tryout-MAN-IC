import json
import re

def enrich_question(q):
    opts = q['options']
    key = q['answerKey']
    expl = q['explanation']
    q_text = q['question']
    
    # 1. Enrich question text if missing expression
    if 'ekspresi berikut' in q_text or 'pecahan berikut' in q_text or 'persamaan berikut' in q_text or 'pertidaksamaan berikut' in q_text:
        # Check steps in explanation to find the expression
        steps = re.findall(r'Langkah \d+\.\s*(.*)', expl)
        if 'pecahan berikut' in q_text and steps:
            # find fractions mentioned in steps
            # e.g., 'KPK penyebut 3 dan 8 adalah 24. Ubah pecahan menjadi 16/24 dan 9/24.' -> 2/3 + 3/8
            # or extract from steps
            step_text = " ".join(steps[:3])
            m_frac = re.search(r'Ubah pecahan menjadi\s*(\d+/\d+)\s*dan\s*(\d+/\d+)', step_text)
            if m_frac:
                q['question'] = f"Hitung hasil operasi penjumlahan pecahan berikut: ({m_frac.group(1)} + {m_frac.group(2)} = ...)"
        elif 'persamaan berikut' in q_text and steps:
            # e.g., 'Kurangi kedua ruas dengan 5: 3x = 15.'
            for s in steps:
                m_eq = re.search(r'(\d+x\s*=\s*\d+)', s)
                if m_eq:
                    q['question'] = f"Tentukan nilai x pada persamaan berikut: {m_eq.group(1)}"
                    break
        elif 'pertidaksamaan berikut' in q_text and steps:
            for s in steps:
                m_ineq = re.search(r'(\d+x\s*<\s*\d+)', s)
                if m_ineq:
                    q['question'] = f"Selesaikan pertidaksamaan berikut: {m_ineq.group(1)}"
                    break
                    
    # 2. Enrich missing options
    if not any(opts.values()) or len([v for v in opts.values() if v.strip()]) < 4:
        steps = re.findall(r'Langkah \d+\.\s*(.*)', expl)
        correct_val = ""
        
        # Check first line of explanation
        first_line = expl.split('\n')[0].strip()
        if first_line and not first_line.startswith("Dasar") and len(first_line) < 60:
            correct_val = first_line
            
        if not correct_val and steps:
            # search through steps from end to start
            for s in reversed(steps):
                m = re.search(r'=\s*([^,;]+?)(?:\.|$)', s)
                if m and len(m.group(1).strip()) < 30:
                    correct_val = m.group(1).strip()
                    break
                    
        if not correct_val and steps:
            correct_val = steps[-1]
            
        # Clean correct_val
        correct_val = re.sub(r'^(Jadi,?\s*|Maka,?\s*|Hasilnya\s*|K =\s*|L =\s*|V =\s*|v =\s*)', '', correct_val).strip()
        
        # Generate reasonable distractors based on type of correct_val
        def make_options(ans, correct_key):
            # Check if number
            num_m = re.search(r'^(\d+(?:\.\d+)?|\d+/\d+)\s*(.*)$', ans)
            new_opts = {}
            if num_m and '/' not in num_m.group(1):
                val_str = num_m.group(1)
                unit = num_m.group(2).strip()
                unit_str = (" " + unit) if unit else ""
                try:
                    val = float(val_str)
                    if val.is_integer():
                        val = int(val)
                    delta = max(1, int(abs(val) * 0.25) if val != 0 else 2)
                    v_a = f"{val - delta}{unit_str}"
                    v_b = f"{val + delta}{unit_str}"
                    v_c = f"{val + 2*delta}{unit_str}"
                    v_d = f"{val - 2*delta if val - 2*delta > 0 else val + 3*delta}{unit_str}"
                    vals = [v_a, v_b, v_c, v_d]
                    letters = ['A', 'B', 'C', 'D']
                    # assign correct answer to correct_key
                    other_letters = [l for l in letters if l != correct_key]
                    new_opts[correct_key] = ans
                    for idx, l in enumerate(other_letters):
                        new_opts[l] = vals[idx]
                    return new_opts
                except:
                    pass
            # Default options if pattern doesn't match
            defaults = [f"Opsi 1: {ans}", f"Opsi 2", f"Opsi 3", f"Opsi 4"]
            letters = ['A', 'B', 'C', 'D']
            other_letters = [l for l in letters if l != correct_key]
            new_opts[correct_key] = ans
            for idx, l in enumerate(other_letters):
                new_opts[l] = f"Nilai alternatif {idx + 1}"
            return new_opts

        opts = make_options(correct_val, key)
        q['options'] = opts

for p_num in range(1, 6):
    file_path = f"data/paket{p_num}.json"
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    for q in data['questions']:
        enrich_question(q)
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"Enriched {file_path}")

print("All packages enriched!")
