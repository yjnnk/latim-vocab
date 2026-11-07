# Gallico

**Endereço do GitHub Pages (após ativação):** https://yjnnk.github.io/latim-vocab/

Dicionário latino–português dos verbos de **De Bello Gallico**, ordenados por frequência. O código e os dados ficam em [`gallico/`](gallico/).

- 1.045 lemas e 12.155 ocorrências verbais nos livros I–VIII.
- Busca por lema, forma flexionada e tradução; aceita u/v e ignora acentos e mácrons.
- Filtros por livro, César I–VII ou obra completa; ordenação por frequência ou alfabética.
- Verbetes com infinitivo, conjugação, formas atestadas, exemplo e distribuição por livro.
- Favoritos locais e exportação CSV dos resultados filtrados.

## Abrir o site

Abra `gallico/dist/index.html` diretamente no navegador. Não há instalação ou compilação: os dados estão em `data.js`, permitindo uso local sem servidor. Alternativamente:

```sh
python3 -m http.server 8765 --directory gallico/dist
```

Acesse http://localhost:8765. O site funciona sem acesso à rede; as fontes tipográficas externas têm fontes locais de reserva.

## Reproduzir a contagem

Requer Python 3 e curl, sem bibliotecas adicionais:

```sh
python3 gallico/scripts/fetch_sources.py
python3 gallico/scripts/build_data.py
python3 gallico/scripts/verify_data.py
```

As fontes são os arquivos CoNLL-U Plus do [LASLA/LiLa](https://github.com/CIRCSE/LASLA). A versão e os hashes SHA-256 estão em `gallico/data/sources.json`. Os arquivos originais são baixados para `data/source/`, ignorada pelo Git, e validados por hash. Os resultados são versionados em JSON, JavaScript e CSV. As traduções editáveis estão em `gallico/data/translations.tsv`.

## Critérios

Contamos tokens com `UPOS=VERB` ou `UPOS=AUX`, agrupados pelo campo `LEMMA` da fonte. Incluímos formas finitas e nominais quando classificadas como verbos; adjetivos classificados como ADJ não são incluídos. Não acrescentamos auxiliares elípticos. Homógrafos com o mesmo lema são reunidos e recebem glosas combinadas. Variantes u/v são preservadas. Cada token verbal conta uma vez, inclusive auxiliares de construções perifrásticas. As posições são recalculadas por corpus, com desempate alfabético.

Os livros I–VII são de Júlio César; o VIII, de Aulo Hírcio. A cobertura dos 20 verbos mais frequentes é uma porcentagem **das ocorrências verbais**, não de todas as palavras da obra. Os números das formas no detalhe se referem aos oito livros.

O infinitivo e a conjugação compõem a identificação de dicionário. As glosas em português e os infinitivos são uma camada editorial preparada para este projeto, sem revisão filológica independente; não pretendem substituir um léxico crítico ou traduzir cada ocorrência. Os exemplos vêm da transcrição do corpus e podem não trazer pontuação.

## Licença e créditos

Corpus e dados derivados: [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/). Créditos ao LASLA, Université de Liège, e à equipe LiLa/CIRCSE, conforme o [repositório original](https://github.com/CIRCSE/LASLA). Traduções: camada editorial deste projeto, sob a mesma licença. Código da interface e scripts: MIT; veja `LICENSE`.

## Hospedagem

O GitHub Pages publica `gallico/dist` automaticamente pelo workflow `.github/workflows/pages.yml`, a cada alteração nessa pasta enviada à branch `main`. Também é possível executar o workflow manualmente na aba Actions. O repositório é público. Para ativar a hospedagem, selecione **GitHub Actions** em Settings → Pages → Source e execute o workflow na aba Actions.

A hospedagem anterior do Sites está identificada em `gallico/.openai/hosting.json` e mantém seu controle de acesso separado.
