Reestruturação do App Next-Calendar em Componentes
Contexto
O app é um marketplace de barbearia/salão (Next-Calendar) em React Native com Expo Router. Atualmente existem 4 telas:

index.tsx — Get Started (tela 8)
login.tsx — Login (telas 9–13)
register.tsx — Registro (telas 13–16)
explore.tsx — Tela template padrão do Expo (não faz parte do design)
O código atual duplica muito (cores, fontes, estilos de inputs) em cada arquivo. O objetivo é:

Extrair componentes reutilizáveis (como em React normal)
Criar as telas faltantes baseadas nas imagens do design
Criar um guia de desenvolvimento explicando a arquitetura
Telas existentes no design (a implementar)
#	Nome	Status
8	Get Started	✅ Existe (index.tsx)
9–13	Login (vários estados)	✅ Existe (login.tsx)
13–16	Registro	✅ Existe (register.tsx)
17	Forgot Password	❌ Criar
18	Enter Verification Code	❌ Criar
19	Create New Password	❌ Criar
20	Password Changed (modal)	❌ Criar
21	Cadastro de Estabelecimento	❌ Criar
22–24	Home (V1/V2/V3 + Scroll)	❌ Criar
25	Search	❌ Criar
31	Barber Details – Open	❌ Criar
32	Barber Details – About	❌ Criar
33	Barber Details – Services	❌ Criar
43	Booking Appointment	❌ Criar
Estrutura de pastas proposta

src/
├── app/
│   ├── _layout.tsx              (atualizar com novas rotas)
│   ├── index.tsx                (Get Started — manter)
│   ├── login.tsx                (refatorar usando components)
│   ├── register.tsx             (refatorar usando components)
│   ├── forgot-password.tsx      [NEW]
│   ├── verify-code.tsx          [NEW]
│   ├── new-password.tsx         [NEW]
│   ├── setup-account.tsx        [NEW] (Cadastro de Estabelecimento)
│   └── (tabs)/
│       ├── _layout.tsx          [NEW] (Tab navigator: Home, Explore, Mensagens, Conta)
│       ├── home.tsx             [NEW]
│       ├── search.tsx           [NEW]
│       ├── messages.tsx         [NEW] (placeholder)
│       └── profile.tsx          [NEW] (placeholder)
│
├── components/
│   ├── ui/                      (componentes genéricos reutilizáveis)
│   │   ├── Button.tsx           [NEW] — Botão primário dourado
│   │   ├── InputField.tsx       [NEW] — Campo de input com label
│   │   ├── SocialButton.tsx     [NEW] — Botão de login social
│   │   ├── Divider.tsx          [NEW] — Divisor "Ou continue com"
│   │   ├── BarberCard.tsx       [NEW] — Card de barbearia
│   │   ├── CategoryPill.tsx     [NEW] — Pílula de categoria
│   │   ├── SearchBar.tsx        [NEW] — Barra de pesquisa
│   │   ├── BottomTabBar.tsx     [NEW] — Tab bar customizada
│   │   └── collapsible.tsx      (já existe)
│   ├── icons/
│   │   └── index.tsx            [NEW] — Todos os SVG icons centralizados
│   └── ...arquivos existentes
│
├── constants/
│   ├── theme.ts                 (expandir com paleta do app)
│   └── colors.ts                [NEW] — GOLD, DARK, GREY_* centralizados
│
└── hooks/
    └── use-fonts.ts             [NEW] — Hook para carregar WorkSans
Mudanças em detalhe
Novo: src/constants/colors.ts
Centraliza GOLD, DARK, GREY_400, GREY_100 — hoje repetidos em cada tela.

Novo: src/hooks/use-fonts.ts
Hook que carrega as fontes WorkSans uma vez, elimina a duplicação nos componentes.

Novo: src/components/ui/Button.tsx
Botão primário dourado usado em todos os formulários.

Novo: src/components/ui/InputField.tsx
Campo de input com label e suporte ao botão de visibilidade de senha — hoje copiado entre login.tsx e register.tsx.

Novo: src/components/ui/SocialButton.tsx
Botão de login social (Google, Apple, Telefone).

Novo: src/components/icons/index.tsx
Centraliza todos os ícones SVG (Eye, Google, Apple, Phone, etc.).

Telas novas
forgot-password.tsx — formulário de e-mail + botão
verify-code.tsx — inputs de 4 dígitos estilo OTP
new-password.tsx — dois campos de senha
setup-account.tsx — formulário de cadastro de estabelecimento
(tabs)/home.tsx — tela principal com promoções, categorias, barbearias próximas
(tabs)/search.tsx — busca com pesquisas recentes + teclado virtual
(tabs)/messages.tsx e profile.tsx — placeholders
Atualizar: src/app/_layout.tsx
Adicionar as novas rotas ao Stack.

Refatorar: login.tsx e register.tsx
Substituir código duplicado pelos novos componentes.

Guia de desenvolvimento
Será criado um arquivo GUIA_DESENVOLVIMENTO.md na raiz do projeto explicando:

Como funciona o Expo Router (file-based routing)
Como criar novas telas
Como usar os componentes
Padrões de estilo do projeto
Plano de execução
Fase 1 — Foundation (constantes e hooks)

Criar src/constants/colors.ts
Criar src/hooks/use-fonts.ts
Fase 2 — Componentes base 3. Criar src/components/icons/index.tsx 4. Criar src/components/ui/Button.tsx 5. Criar src/components/ui/InputField.tsx 6. Criar src/components/ui/SocialButton.tsx 7. Criar src/components/ui/Divider.tsx 8. Criar src/components/ui/SearchBar.tsx 9. Criar src/components/ui/BarberCard.tsx 10. Criar src/components/ui/CategoryPill.tsx

Fase 3 — Refatorar telas existentes 11. Refatorar login.tsx 12. Refatorar register.tsx 13. Refatorar index.tsx

Fase 4 — Telas de Auth 14. Criar forgot-password.tsx 15. Criar verify-code.tsx 16. Criar new-password.tsx 17. Criar setup-account.tsx

Fase 5 — Telas principais (tabs) 18. Criar (tabs)/_layout.tsx com tab bar customizada 19. Criar (tabs)/home.tsx 20. Criar (tabs)/search.tsx 21. Criar (tabs)/messages.tsx e profile.tsx

Fase 6 — Telas de detalhes 22. Criar barber/[id].tsx — detalhes da barbearia 23. Criar booking.tsx — agendamento

Fase 7 — Atualizar _layout e guia 24. Atualizar _layout.tsx com todas as rotas 25. Criar GUIA_DESENVOLVIMENTO.md

Verificação
Rodar expo start e verificar que o app compila sem erros
Navegar por todas as telas para confirmar visual correto
Perguntas abertas
IMPORTANT

Quais telas são prioridade? Posso implementar tudo de uma vez, mas se quiser começar por um subconjunto, me diga.

NOTE

Sobre o explore.tsx: Esse arquivo é um template padrão do Expo e não faz parte do design. Posso removê-lo ou deixar como referência técnica.

NOTE

Tab Bar: No design, a tab bar tem 5 ícones: Home, Explorar, Agendamento (QR), Mensagens, Conta. Vou usar uma tab bar customizada já que o design tem um botão circular central especial (o ícone de QR/agendamento em destaque).