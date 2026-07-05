# 量词 (Liàngcí) Matcher

A small practice tool for HSK1 and HSK2 learners to master Chinese measure words (classifiers, 量词). Match the correct classifier to a noun, build natural measure word phrases, and learn why answers are right or wrong.

Built with plain HTML, CSS, and vanilla JavaScript (ES modules). Fully static, no build step, no trackers, everything runs entirely in your browser.

**Practise here: https://echopatter.github.io/liangci-matcher/**

## Practice modes

- **Match drill**: see a noun, pick the classifier. Two tier scoring: the best answer earns full credit, 个 where a specific classifier is expected earns half credit with a short note.
- **Reverse drill**: see a classifier, pick the noun it pairs with.
- **Phrase builder**: assemble 数字 + 量词 + 名词 chips. Enforces the 两 vs 二 rule and can show the 一 tone change (yí gè vs yì běn).
- **Context clash**: the same noun, different situations. A glass of water or a bottle, one shoe or the pair.
- **Custom drill**: pick exactly which classifiers to drill, or start from a common confusion pair like 张 vs 条.

Wrong answers always get a short semantic explanation, never a bare X. The structural classifiers (岁, 次, 些, 点儿, and 遍 with the extended tier) have their own lesson screen because they do not classify nouns the normal way.

## Data and verification

- Every noun-classifier pairing was verified against classifier senses in 《现代汉语词典》 (商务印书馆, 7th ed.) and CC-CEDICT CL fields (machine cross check only).
- HSK band tags may only come from the GF 0025-2021 (《国际中文教育中文水平等级标准》) wordlist. No row has been verified against that list yet, so every `hsk` field in the data is `null` and the app gates content with its own `tier` field instead (`core`, `stretch`, `hsk3`).
- The HSK3 extended tier (把, 台, 场, 部, 种, 层, 段, 座, 篇, 匹, 遍) is off by default. Turn it on in Settings.

## Run locally

ES modules need a real HTTP server (file:// will not work):

```
python -m http.server 8321
```

Then open http://localhost:8321/

## State

Progress (mastery per classifier, personal confusion matrix) and settings live in localStorage under one key. Export and import them as JSON from the Settings screen.
