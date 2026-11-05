import glob, re, os

total = 0
for path in glob.glob("secure-commerce-ai/backend/src/test/java/com/securecommerce/platform/*.java"):
    with open(path, encoding="utf-8") as f:
        content = f.read()
    tests = len(re.findall(r'@Test\b', content))
    filename = os.path.basename(path)
    print(f"{filename}: {tests}")
    total += tests
print("Total @Test count:", total)

