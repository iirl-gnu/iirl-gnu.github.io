"""
연구실적 엑셀 → 홈페이지 데이터 자동 변환

사용법:
    python tools/sync_from_excel.py "C:\\경로\\박영진_연구실적_정리.xlsx"
또는 tools/update.bat 위에 엑셀 파일을 끌어다 놓으세요.

생성되는 파일:
    data/publications.yml  (국제/국내 저널, 국제/국내 학술대회, 특허)
    data/projects.yml      (연구과제)

엑셀의 시트 이름과 첫 줄(헤더) 이름으로 열을 찾으므로 열 순서는 바뀌어도 됩니다.
연구비, 이력서 반영 여부, 비고 같은 내부 정보는 홈페이지에 올라가지 않습니다.
Python 기본 라이브러리만 사용하므로 별도 설치가 필요 없습니다.
"""

import json
import re
import sys
import zipfile
import posixpath
from datetime import date, datetime, timedelta
from pathlib import Path
from xml.dom import minidom

SITE = Path(__file__).resolve().parent.parent
DATA = SITE / "data"
TODAY = date.today()


# ---------------------------------------------------------------- xlsx reader

def read_xlsx(path):
    """Return {sheet_name: [ {header: value} , ... ]} using the first row as headers."""
    z = zipfile.ZipFile(path)
    shared = []
    if "xl/sharedStrings.xml" in z.namelist():
        doc = minidom.parseString(z.read("xl/sharedStrings.xml"))
        for si in doc.getElementsByTagName("si"):
            shared.append("".join(t.firstChild.data for t in si.getElementsByTagName("t") if t.firstChild))

    wb = minidom.parseString(z.read("xl/workbook.xml"))
    rels = minidom.parseString(z.read("xl/_rels/workbook.xml.rels"))
    rmap = {r.getAttribute("Id"): r.getAttribute("Target") for r in rels.getElementsByTagName("Relationship")}

    def col_idx(ref):
        n = 0
        for ch in re.match(r"[A-Z]+", ref).group():
            n = n * 26 + ord(ch) - 64
        return n - 1

    sheets = {}
    for sh in wb.getElementsByTagName("sheet"):
        target = rmap[sh.getAttribute("r:id")].lstrip("/")
        if not target.startswith("xl/"):
            target = posixpath.join("xl", target)
        doc = minidom.parseString(z.read(target))
        rows = []
        for row in doc.getElementsByTagName("row"):
            cells = {}
            for c in row.getElementsByTagName("c"):
                t = c.getAttribute("t")
                if t == "inlineStr":
                    val = "".join(x.firstChild.data for x in c.getElementsByTagName("t") if x.firstChild)
                else:
                    v = c.getElementsByTagName("v")
                    if not v or not v[0].firstChild:
                        continue
                    val = v[0].firstChild.data
                    if t == "s":
                        val = shared[int(val)]
                cells[col_idx(c.getAttribute("r"))] = val.strip()
            if cells:
                rows.append(cells)
        if not rows:
            continue
        header = {i: h for i, h in rows[0].items()}
        records = [{header[i]: v for i, v in r.items() if i in header} for r in rows[1:]]
        sheets[sh.getAttribute("name")] = records
    return sheets


# ---------------------------------------------------------------- helpers

def numbered(rows):
    """Keep only real data rows (the 'No' column is a number)."""
    return [r for r in rows if re.fullmatch(r"\d+(\.0)?", r.get("No", ""))]


def to_date(v):
    """Excel serial number or 'YYYY-MM-DD' string → date (or None)."""
    if not v:
        return None
    if re.fullmatch(r"\d+(\.\d+)?", v):
        return (datetime(1899, 12, 30) + timedelta(days=float(v))).date()
    try:
        return datetime.strptime(v[:10], "%Y-%m-%d").date()
    except ValueError:
        return None


def ym(d):
    return d.strftime("%Y.%m") if d else ""


def year(v):
    m = re.search(r"\d{4}", v or "")
    return int(m.group()) if m else None


def venue(*parts):
    return ", ".join(p for p in parts if p)


def pages(p):
    if not p:
        return ""
    # "191-202" → "pp. 191–202", 논문번호(eadj0461, 286 (Article No.))는 그대로
    return f"pp. {p.replace('-', '–')}" if re.fullmatch(r"\d+\s*-\s*\d+", p) else p


def pick(row, *names):
    for n in names:
        if row.get(n):
            return row[n]
    return ""


# ---------------------------------------------------------------- publications

def build_publications(sheets):
    out = {}

    out["international_journal"] = [
        {
            "authors": r.get("저자", ""),
            "title": r.get("제목", ""),
            "venue": venue(
                r.get("게재지"),
                f"vol. {r['권']}" if r.get("권") else "",
                f"no. {r['호']}" if r.get("호") else "",
                pages(r.get("페이지")),
            ),
            "year": year(r.get("연도")),
            "doi": r.get("DOI", ""),
        }
        for r in numbered(sheets.get("국제저널", []))
    ]

    out["domestic_journal"] = [
        {
            "authors": r.get("저자", ""),
            "title": pick(r, "제목(국문)", "제목"),
            "title_en": r.get("제목(영문)", ""),
            "venue": venue(
                r.get("게재지"),
                f"제{r['권']}권" if r.get("권") else "",
                f"제{r['호']}호" if r.get("호") else "",
                pages(r.get("페이지")),
            ),
            "year": year(r.get("연도")),
            "doi": r.get("DOI", ""),
        }
        for r in numbered(sheets.get("국내저널", []))
    ]

    for key, sheet in (("international_conference", "국제학술대회"), ("domestic_conference", "국내학술대회")):
        items = []
        for r in numbered(sheets.get(sheet, [])):
            title, title_en = r.get("제목", ""), ""
            # 국내학술대회: "국문 제목 (English Title)" → 분리
            m = re.fullmatch(r"(.+?)\s*\(([A-Za-z][^가-힣]+)\)\s*", title)
            if m and re.search(r"[가-힣]", m.group(1)):
                title, title_en = m.group(1).strip(), m.group(2).strip()
            items.append({
                "authors": r.get("저자", ""),
                "title": title,
                "title_en": title_en,
                "venue": venue(r.get("학술대회"), r.get("개최지"), pages(r.get("페이지"))),
                "year": year(r.get("연도")),
                "doi": r.get("DOI", ""),
            })
        out[key] = items

    out["patents_granted"] = [
        {"number": r.get("특허번호", ""), "title": r.get("명칭", ""), "date": str(to_date(r.get("등록일")) or "")}
        for r in numbered(sheets.get("특허_등록", []))
    ]

    # 이미 등록된 출원(비고에 '등록')과 포기된 출원(Abandoned)은 제외
    out["patents_applied"] = [
        {"number": r.get("공개번호", ""), "title": r.get("명칭", ""), "date": str(to_date(r.get("공개일")) or "")}
        for r in numbered(sheets.get("특허_출원", []))
        if "등록" not in r.get("비고", "") and "Abandoned" not in r.get("비고", "")
    ]

    out["patents_domestic"] = [
        {
            "number": r.get("출원번호", ""),
            "title": r.get("명칭", ""),
            "title_en": r.get("영문 명칭", ""),
            "inventors": r.get("발명자", ""),
            "date": str(to_date(r.get("출원일")) or ""),
        }
        for r in numbered(sheets.get("특허_국내출원", []))
    ]
    return out


# ---------------------------------------------------------------- projects

def build_projects(sheets):
    current, finished = [], []
    rows = numbered(sheets.get("연구과제", []))
    rows.sort(key=lambda r: to_date(r.get("연구 시작")) or date.min, reverse=True)
    for r in rows:
        # 연구실이 실제로 참여한 기간 기준 (참여 기간이 없으면 과제 전체 기간)
        start = to_date(r.get("참여 시작")) or to_date(r.get("연구 시작"))
        end = to_date(r.get("참여 종료")) or to_date(r.get("연구 종료"))
        status = r.get("진행 상태", "")
        ongoing = ("진행" in status) if status else bool(end and end >= TODAY)
        kind = r.get("구분", "")
        # "산업통상자원부→기후에너지환경부(2026)" → "기후에너지환경부"
        ministry = re.sub(r"\(\d{4}\)$", "", r.get("부처", "").split("→")[-1]).strip()
        if kind == "정부과제":
            sponsor = venue(ministry, r.get("사업명"))
        else:
            sponsor = venue(r.get("전문기관·발주처"), r.get("사업명"))
        lead = r.get("주관(협약)기관", "")
        item = {
            "title": r.get("과제명", ""),
            "sponsor": sponsor,
            "lead": lead if lead and not lead.startswith("경상국립대학교") else "",
            "type": kind,
            "period": f"{ym(start)} – {ym(end)}",
            "role": r.get("역할", ""),
        }
        (current if ongoing else finished).append(item)
    return {"current": current, "finished": finished}


# ---------------------------------------------------------------- yaml writer

def to_yaml(obj, indent=0):
    """Small YAML writer (strings are JSON-quoted, which is valid YAML)."""
    pad = "  " * indent
    lines = []
    if isinstance(obj, dict):
        for k, v in obj.items():
            if isinstance(v, (dict, list)) and v:
                lines.append(f"{pad}{k}:")
                lines.append(to_yaml(v, indent + 1))
            else:
                lines.append(f"{pad}{k}: {scalar(v)}")
    elif isinstance(obj, list):
        for item in obj:
            if isinstance(item, dict):
                first = True
                for k, v in item.items():
                    if v in ("", None):
                        continue
                    prefix = f"{pad}- " if first else f"{pad}  "
                    lines.append(f"{prefix}{k}: {scalar(v)}")
                    first = False
                lines.append("")
            else:
                lines.append(f"{pad}- {scalar(item)}")
    return "\n".join(lines)


def scalar(v):
    if v is None or v == "":
        return '""'
    if isinstance(v, list):
        return "[]"
    if isinstance(v, (int, float)):
        return str(v)
    return json.dumps(str(v), ensure_ascii=False)


HEADER = """# ⚠️ 이 파일은 tools/sync_from_excel.py 가 자동으로 만듭니다.
# 직접 고치면 다음 동기화 때 덮어써집니다. 엑셀을 고친 뒤 다시 실행하세요.
# 생성: {now} / 원본: {src}

"""


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    src = Path(sys.argv[1])
    if not src.exists():
        sys.exit(f"엑셀 파일을 찾을 수 없습니다: {src}")

    sheets = read_xlsx(src)
    now = datetime.now().strftime("%Y-%m-%d %H:%M")
    head = HEADER.format(now=now, src=src.name)

    pubs = build_publications(sheets)
    (DATA / "publications.yml").write_text(head + to_yaml(pubs) + "\n", encoding="utf-8")

    projects = build_projects(sheets)
    (DATA / "projects.yml").write_text(head + to_yaml(projects) + "\n", encoding="utf-8")

    print("완료!")
    for k, v in pubs.items():
        print(f"  {k:26s} {len(v):3d}건")
    print(f"  {'projects (진행 중 / 완료)':26s} {len(projects['current'])} / {len(projects['finished'])}건")


if __name__ == "__main__":
    main()
