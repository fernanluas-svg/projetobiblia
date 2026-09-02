import os
import json

BOOKS_DIR = os.path.join(os.path.dirname(__file__), '../src/data/books')
COMBINED_PATH = os.path.join(os.path.dirname(__file__), '../src/data/nvi_com_pericopes.json')

# Mapeamento oficial e limpo de perícopes da NVI associadas estritamente ao índice do capítulo (0-based) e versículo (0-based)
# Formato: { 'abrev': { cap_idx: { verse_idx: "Título da Perícope" } } }
PERICOPES_DB = {
    'gn': {
        0: {0: "A criação do mundo"},
        1: {3: "O homem no jardim do Édem"},
        2: {0: "A queda do homem"},
        3: {0: "Caim e Abel"},
        4: {0: "Adão gera a Sete"},
        5: {0: "Noé e o Dilúvio"},
        6: {0: "A arca de Noé"},
        7: {0: "O dilúvio cobre a terra"},
        8: {0: "Deus abençoa a Noé"},
        9: {0: "Os descendentes de Noé"},
        10: {0: "A torre de Babel"},
        11: {0: "A chamada de Abrão"},
        12: {0: "Abrão e Sarai no Egito"},
        13: {0: "Abrão e Ló se separam"},
        14: {0: "Abrão resgata a Ló"},
        15: {0: "A aliança de Deus com Abrão"},
        16: {0: "O nascimento de Ismael"},
        17: {0: "A aliança da circuncisão"},
        18: {0: "A promessa de um filho a Abraão"},
        19: {0: "A destruição de Sodoma e Gomorra"},
        20: {0: "Abraão e Abimeleque"},
        21: {0: "O nascimento de Isaque"},
        22: {0: "O teste da fé de Abraão"},
        23: {0: "A morte e o sepultamento de Sara"},
        24: {0: "Isaque e Rebeca"},
        25: {0: "A morte de Abraão; os descendentes de Ismael"},
        26: {0: "Isaque em Gerar"},
        27: {0: "Isaque abençoa a Jacó"},
        28: {0: "A visão de Jacó em Betel"},
        29: {0: "Jacó chega a Harã; casa-se com Lia e Raquel"},
        30: {0: "Os filhos de Jacó"},
        31: {0: "Jacó foge de Labão"},
        32: {0: "Jacó se prepara para encontrar-se com Esaú"},
        33: {0: "O encontro de Jacó e Esaú"},
        34: {0: "Diná e os siquemitas"},
        35: {0: "Jacó retorna a Betel"},
        36: {0: "Os descendentes de Esaú"},
        37: {0: "José e seus irmãos"},
        38: {0: "Judá e Tamar"},
        39: {0: "José e a mulher de Potifar"},
        40: {0: "José interpreta sonhos na prisão"},
        41: {0: "José perante o faraó"},
        42: {0: "Os irmãos de José vão ao Egito"},
        43: {0: "A segunda viagem dos irmãos ao Egito"},
        44: {0: "A taça de José no saco de Benjamim"},
        45: {0: "José se revela a seus irmãos"},
        46: {0: "Jacó desce com sua família para o Egito"},
        47: {0: "José e os egípcios durante a fome"},
        48: {0: "Jacó abençoa Efraim e Manassés"},
        49: {0: "As últimas palavras de Jacó a seus filhos"}
    },
    'mt': {
        0: {0: "A genealogia de Jesus Cristo", 18: "O nascimento de Jesus"},
        1: {0: "A visita dos magos", 13: "A fuga para o Egito", 19: "O retorno para Nazaré"},
        2: {0: "A pregacão de João Batista", 13: "O batismo de Jesus"},
        3: {0: "A tentação de Jesus"},
        4: {0: "O início do ministério de Jesus na Galileia", 18: "O chamado dos primeiros discípulos", 23: "Jesus cura os enfermos"},
        5: {0: "As bem-aventuranças", 13: "O sal e a luz", 17: "O cumprimento da Lei", 21: "A ira", 27: "O adultério", 31: "O divórcio", 33: "O juramento", 38: "O amor aos inimigos", 43: "O amor aos inimigos"},
        6: {0: "A esmola", 5: "A oração", 9: "O Pai Nosso", 16: "O jejum", 19: "Tesouros no céu", 25: "A ansiedade"},
        7: {0: "O julgar os outros", 7: "Peçam e lhes será dado", 13: "A porta estreita", 15: "A árvore e seus frutos", 24: "O construtor sábio e o insensato"},
        8: {0: "Jesus cura um leproso", 5: "A fé do oficial romano", 14: "Jesus cura muitas pessoas", 18: "O custo de seguir a Jesus", 23: "Jesus acalma a tempestade", 28: "Jesus cura dois endemoninhados gadarenos"},
        9: {0: "Jesus cura um paralítico", 9: "O chamado de Mateus", 14: "Pergunta sobre o jejum", 18: "A filha de Jairo e a mulher que tocou em sua capa", 27: "Jesus cura dois cegos", 32: "Jesus cura um mudo endemoninhado", 35: "A messe é grande, os trabalhadores são poucos"}
    }
}

def update_books():
    print("Atualizando perícopes nos livros com mapeamento estrito por versículo...")
    if not os.path.exists(BOOKS_DIR):
        print(f"Diretório não encontrado: {BOOKS_DIR}")
        return

    all_books_data = {}
    files = [f for f in os.listdir(BOOKS_DIR) if f.endswith('.json')]
    
    for file_name in files:
        abbrev = file_name.replace('.json', '')
        file_path = os.path.join(BOOKS_DIR, file_name)
        
        with open(file_path, 'r', encoding='utf-8') as f:
            book_data = json.load(f)

        book_pericopes = PERICOPES_DB.get(abbrev, {})
        updated_chapters = []

        for c_idx, chapter in enumerate(book_data.get('chapters', [])):
            chapter_pericopes = book_pericopes.get(c_idx, {})
            updated_chapter = []
            
            for v_idx, verse_item in enumerate(chapter):
                # Extrai apenas o texto puro da string ou do objeto existente
                verse_text = verse_item['text'] if isinstance(verse_item, dict) else verse_item
                verse_obj = {"text": verse_text}
                
                # Associa o título estritamente se houver mapeamento para este versículo
                title = chapter_pericopes.get(v_idx)
                if title:
                    verse_obj["title"] = title

                updated_chapter.append(verse_obj)
            updated_chapters.append(updated_chapter)

        book_data['chapters'] = updated_chapters
        all_books_data[abbrev] = book_data

        # Salva o arquivo individual do livro
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(book_data, f, ensure_ascii=False, indent=2)

    # Salva o arquivo consolidado nvi_com_pericopes.json
    with open(COMBINED_PATH, 'w', encoding='utf-8') as f:
        json.dump(all_books_data, f, ensure_ascii=False, indent=2)

    print("Atualização e regeneração concluídas com sucesso!")

if __name__ == '__main__':
    update_books()
