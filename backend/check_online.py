with open('app.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

keywords = ['last_seen = datetime', 'online_threshold = datetime', 'is_online = True', 'is_online = False']
results = []
for i, line in enumerate(lines):
    stripped = line.strip()
    if any(kw in stripped for kw in keywords):
        results.append(f'Line {i+1}: {stripped}')

with open('check_result.txt', 'w') as f:
    f.write('\n'.join(results))

print('Done, check check_result.txt')
