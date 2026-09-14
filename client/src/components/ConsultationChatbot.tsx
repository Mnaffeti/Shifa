import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, Loader2 } from 'lucide-react';
import chatbotIcon from '../assests/chatbotIcon.avif';

/**
 * Floating assistant for the consultation page.
 * Talks to Groq's OpenAI-compatible chat/completions endpoint directly from
 * the browser. The API key is injected at build time via VITE_GROQ_API_KEY.
 */

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'openai/gpt-oss-20b';
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY as string | undefined;

interface Msg {
  role: 'user' | 'assistant';
  content: string;
}

interface Props {
  /** Short description of the current patient/consultation for grounding. */
  context?: string;
}

/** Inline markdown: **bold** and *italic* → styled spans. */
function renderInline(text: string, keyPrefix: string) {
  const nodes: ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  const parts = text.split(regex);
  parts.forEach((part, i) => {
    if (!part) return;
    if (part.startsWith('**') && part.endsWith('**')) {
      nodes.push(<strong key={`${keyPrefix}-b-${i}`} className="font-bold text-primary">{part.slice(2, -2)}</strong>);
    } else if (part.startsWith('`') && part.endsWith('`')) {
      nodes.push(<code key={`${keyPrefix}-c-${i}`} className="px-1 py-0.5 rounded bg-bg-soft text-[13px] font-medium">{part.slice(1, -1)}</code>);
    } else if (part.startsWith('*') && part.endsWith('*')) {
      nodes.push(<em key={`${keyPrefix}-i-${i}`}>{part.slice(1, -1)}</em>);
    } else {
      nodes.push(part);
    }
  });
  return nodes;
}

/** Minimal block-level markdown renderer for assistant replies. */
function Markdown({ text }: { text: string }) {
  const lines = text.split('\n');
  const blocks: ReactNode[] = [];
  let list: string[] = [];

  const flushList = (key: string) => {
    if (list.length === 0) return;
    blocks.push(
      <ul key={key} className="flex flex-col gap-1 my-1.5 pl-1">
        {list.map((item, i) => (
          <li key={i} className="flex gap-2">
            <span className="text-primary mt-[2px] shrink-0">•</span>
            <span className="flex-1">{renderInline(item, `${key}-${i}`)}</span>
          </li>
        ))}
      </ul>
    );
    list = [];
  };

  lines.forEach((raw, idx) => {
    const line = raw.trimEnd();
    const bullet = line.match(/^\s*[-*]\s+(.*)$/);
    const heading = line.match(/^\s*#{1,6}\s+(.*)$/);

    if (bullet) {
      list.push(bullet[1]);
      return;
    }
    flushList(`ul-${idx}`);

    if (heading) {
      blocks.push(
        <p key={`h-${idx}`} className="font-bold text-primary mt-2 mb-0.5">
          {renderInline(heading[1], `h-${idx}`)}
        </p>
      );
    } else if (line.trim() === '') {
      // blank line → spacing only, skip empty <p>
    } else {
      blocks.push(
        <p key={`p-${idx}`} className="my-0.5">
          {renderInline(line, `p-${idx}`)}
        </p>
      );
    }
  });
  flushList('ul-end');

  return <div className="flex flex-col">{blocks}</div>;
}

export default function ConsultationChatbot({ context }: Props) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: 'assistant',
      content:
        "Bonjour 👋 Je suis votre assistant clinique. Posez-moi une question sur ce patient, un diagnostic, une posologie ou un protocole.",
    },
  ]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const next: Msg[] = [...messages, { role: 'user', content: text }];
    setMessages(next);
    setInput('');
    setLoading(true);

    if (!GROQ_API_KEY) {
      setMessages([
        ...next,
        {
          role: 'assistant',
          content:
            "⚠️ Clé API manquante. Ajoutez VITE_GROQ_API_KEY dans votre fichier .env puis redémarrez le serveur.",
        },
      ]);
      setLoading(false);
      return;
    }

    const systemPrompt = `# RÔLE
Tu es un assistant médical clinique — un médecin senior expérimenté qui épaule un confrère \
pendant sa consultation. Tu es intégré directement dans le dossier de consultation du patient \
et tu réponds comme une aide à la décision médicale de confiance.

# INSTRUCTIONS
- Réponds en français, vocabulaire médical précis.
- Sois BREF : vise moins de 150 mots. Va droit au but, pas de remplissage ni de répétition.
- Utilise le markdown : **gras** pour les termes clés, listes à puces "- ", et titres courts si besoin.
- Une idée par puce, phrases courtes. Pas de longs paragraphes.
- Tiens compte du contexte patient ci-dessous ; signale toute contre-indication ou allergie pertinente.
- N'invente JAMAIS de données patient. Si une info manque, demande-la.
- Ne remplace pas le jugement clinique ; pas de diagnostic définitif à la place du médecin.

# CONTEXTE (dossier de la consultation en cours)
${context || 'Aucun contexte patient fourni.'}

# ENTRÉE
La question du médecin figure dans le dernier message de la conversation.

# FORMAT DE SORTIE ATTENDU (concis)
**Réponse** : 1 phrase directe.
- puces courtes (diagnostics / posologies / examens)
- **⚠️** ligne d'alerte seulement si contre-indication/allergie pertinente

Ne mets un rappel de décision médicale QUE si la question porte sur une prescription ou un traitement.`;

    try {
      const res = await fetch(GROQ_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            ...next.map(m => ({ role: m.role, content: m.content })),
          ],
          temperature: 0.4,
          // Cap the length so replies stay concise and well-scoped.
          max_completion_tokens: 700,
          top_p: 1,
          // If set, partial message deltas will be sent.
          stream: true,
        }),
      });

      if (!res.ok || !res.body) {
        const detail = res.body ? await res.text() : '';
        throw new Error(`${res.status} ${detail.slice(0, 200)}`);
      }

      // Add an empty assistant bubble, then fill it as deltas arrive.
      setMessages([...next, { role: 'assistant', content: '' }]);
      setLoading(false);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let acc = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? ''; // keep the last, possibly-incomplete line

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const payload = trimmed.slice(5).trim();
          if (payload === '[DONE]') continue;

          try {
            const json = JSON.parse(payload);
            const delta: string = json?.choices?.[0]?.delta?.content ?? '';
            if (delta) {
              acc += delta;
              // Update only the last (assistant) message with the accumulated text.
              setMessages(prev => {
                const copy = [...prev];
                copy[copy.length - 1] = { role: 'assistant', content: acc };
                return copy;
              });
            }
          } catch {
            // ignore keep-alive / non-JSON lines
          }
        }
      }

      if (!acc) {
        setMessages(prev => {
          const copy = [...prev];
          copy[copy.length - 1] = {
            role: 'assistant',
            content: "Désolé, je n'ai pas pu générer de réponse.",
          };
          return copy;
        });
      }
    } catch (err) {
      setMessages([
        ...next,
        {
          role: 'assistant',
          content: `⚠️ Erreur lors de la requête à l'assistant. ${
            err instanceof Error ? err.message : ''
          }`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <>
      {/* Floating launcher — bottom right (simple circle); hidden while the drawer is open */}
      <AnimatePresence>
        {!open && (
          <motion.button
            onClick={() => setOpen(true)}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.94 }}
            className="fixed bottom-6 right-6 z-[70] w-16 h-16 rounded-full bg-primary text-white shadow-xl flex items-center justify-center hover:brightness-110 transition-all overflow-hidden"
            aria-label="Assistant IA clinique"
          >
            <img src={chatbotIcon} alt="" className="w-full h-full object-cover" />
            <span className="absolute inset-0 rounded-full ring-2 ring-accent/50 pulse-accent" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat drawer — slides in from the right */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-[2px]"
            />

            {/* Drawer */}
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', ease: [0.32, 0.72, 0, 1], duration: 0.35 }}
              className="fixed top-0 right-0 bottom-0 z-[65] w-full max-w-[440px] bg-white shadow-2xl border-l border-border-subtle flex flex-col"
            >
              {/* Header */}
              <div className="px-6 py-5 bg-primary text-white flex items-center gap-3 shrink-0">
                <span className="w-11 h-11 rounded-full overflow-hidden bg-white/15 flex items-center justify-center shrink-0">
                  <img src={chatbotIcon} alt="" className="w-full h-full object-cover" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-base font-bold leading-tight">Assistant clinique</p>
                  <p className="text-xs text-white/70 font-medium">Propulsé par SHIFA · IA d'aide à la décision</p>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="p-1.5 hover:bg-white/10 rounded-full transition-colors shrink-0"
                  aria-label="Fermer"
                >
                  <X size={22} />
                </button>
              </div>

              {/* Messages */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-4 bg-bg-soft/40">
                {messages.map((m, i) => {
                  const isLast = i === messages.length - 1;
                  const streaming = isLast && m.role === 'assistant' && !loading;
                  return (
                    <div
                      key={i}
                      className={`max-w-[88%] px-4 py-3 rounded-2xl text-[15px] leading-relaxed ${
                        m.role === 'user'
                          ? 'self-end bg-primary text-white rounded-br-md whitespace-pre-wrap'
                          : 'self-start bg-white border border-border-subtle text-text-primary rounded-bl-md shadow-sm'
                      }`}
                    >
                      {m.role === 'assistant' ? <Markdown text={m.content} /> : m.content}
                      {streaming && m.content === '' && (
                        <span className="inline-block w-1.5 h-4 -mb-0.5 bg-primary/60 rounded-sm animate-pulse" />
                      )}
                    </div>
                  );
                })}
                {loading && (
                  <div className="self-start bg-white border border-border-subtle text-text-muted rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2 shadow-sm">
                    <Loader2 size={16} className="animate-spin" />
                    <span className="text-[15px]">Réflexion…</span>
                  </div>
                )}
              </div>

              {/* Composer */}
              <div className="p-4 border-t border-border-subtle bg-white shrink-0">
                <div className="flex items-end gap-2 rounded-2xl border border-border-subtle focus-within:ring-2 focus-within:ring-primary/20 px-4 py-2.5">
                  <textarea
                    ref={inputRef}
                    rows={1}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={onKeyDown}
                    placeholder="Posez une question clinique…"
                    className="flex-1 resize-none max-h-32 bg-transparent text-[15px] focus:outline-none placeholder:text-text-muted"
                  />
                  <button
                    onClick={send}
                    disabled={!input.trim() || loading}
                    className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center shrink-0 hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="Envoyer"
                  >
                    <Send size={18} />
                  </button>
                </div>
                <p className="text-[11px] text-text-muted mt-2 px-1">
                  Aide à la décision — la validation finale revient au médecin.
                </p>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
