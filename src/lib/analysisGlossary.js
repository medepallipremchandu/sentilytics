/**
 * Explanations for analysis UI labels. Values like "Multimodal" / "Text-only" are chosen in the
 * frontend from hasAudio + audio presence — they are not arbitrary model outputs.
 */

export const GLOSSARY = {
  howThisWasDecided:
    'High-level summary of how this result was produced: which inputs were used (text vs text+audio), and that the full pipeline (perception → sentiment → topics → insight) ran. Open Evidence for step-by-step detail.',

  multimodal:
    'This item was processed with both transcript text and measured audio features (timing, pitch, volume, pauses, etc.). The badge is shown when the submission included audio and the backend returned an audio analysis block — it is a UI rule, not a label copied from the LLM.',

  textOnly:
    'Analysis used the transcript (or typed text) only. Either there was no recording, or no audio feature bundle was available for this row.',

  fullAnalysis:
    'Indicates the standard end-to-end analysis path ran (linguistics, sentiment, topics, summary, recommended action). It is a product badge for this screen, not a separate API mode name.',

  audioSignalTab:
    'Shows the stored recording as a waveform, rule-based tone and prosody stats, and per-segment acoustic features. It explains how the voice sounded; the Analysis tab explains interpreted meaning.',

  confidenceLabel:
    'A categorical confidence from the model (e.g. high / moderate) summarizing how strongly the model stands behind its sentiment and topic conclusions.',

  confidenceScore:
    'A numeric score (often 0–1) reflecting model confidence in the overall interpretation.',

  segmentTimeline:
    'Time-aligned segments from the recording: per slice, sentiment hints and flags (e.g. tone shift) when the backend provides segment insights.',

  signalAndTone:
    'Interpreted delivery style from the model: overall tone, alignment with content, sarcasm and hesitation signals — mostly from language; audio cues contribute when multimodal.',

  originalFeedback:
    'The transcript or message text the analysis was run on (after any privacy masking visible to your role).',

  supportingEvidence:
    'Short quotes or paraphrases the model used to justify its summary and sentiment.',

  recommendedAction:
    'A suggested next step generated from topics, sentiment, and conflict/negativity flags.',

  keyPhrases:
    'Salient phrases the model highlighted as characteristic of the feedback.',

  keyTopics:
    'Themes inferred from the transcript (and audio context when multimodal).',

  negativitySources: 'Phrases or patterns flagged as contributing to negative sentiment.',
  negativeStatements: 'Statements classified as expressing negative sentiment or criticism.',
  positiveStatements: 'Statements classified as expressing positive sentiment or praise.',
  actionItems: 'Concrete follow-ups inferred from the content.',
  unresolvedIssues: 'Open problems or complaints not framed as resolved.',

  decisionChain:
    'When present, a numbered list of reasoning steps returned by the backend for this analysis.',

  processingStages:
    'Ordered pipeline: how text (and optional audio features) flows through anonymization, perception, sentiment, topics, and insight generation.',

  anonymization:
    'Privacy and masking: what identifiers appear as placeholders in the text you see, separate from the LLM reasoning itself.',

  perception:
    'Tokenization and linguistic/audio feature extraction before the main sentiment model.',

  sentimentAnalysis:
    'Model that infers emotion, tone, direction, and confidence from the prepared inputs.',

  topicClassification:
    'Assigns primary/secondary topics and key themes using the transcript (and optional audio context).',

  insightGeneration:
    'Builds the summary, evidence bullets, and recommended action from prior stages.',

  analysisMode:
    'Whether the sentiment/topic model received multimodal features (text + audio-derived signals) or text features only.',

  primaryTopic: 'The main theme the model assigned to this feedback.',
  secondaryTopic: 'An additional theme when the model detects a second focus area.',

  overallTone: 'The model’s read of delivery style (e.g. frustrated, neutral).',
  toneAlignment: 'Whether spoken tone matches the literal meaning of the words.',
  sarcasmDetected: 'Heuristic/model flag for sarcastic or ironic delivery.',
  hesitationDetected: 'Heuristic/model flag for hedging, uncertainty, or disfluency.',

  routingNote:
    'Routing between different model paths is not used in this product build; all rows use the same pipeline shape.',

  sentimentScore:
    'Continuous score from -1 (most negative) to +1 (most positive), derived from the model’s sentiment signals for this feedback.',
}

/** Inline tab labels (Analysis / Evidence / Audio Signal / …) */
export const TAB_HINTS = {
  analysis:
    'AI interpretation: summary, sentiment, tone, topics, key phrases, segment timeline when present, and recommended actions.',
  evidence:
    'Technical trace: pipeline stages, inputs and outputs, token usage, privacy masking, and decision chain.',
  speakers: 'Speaker-related breakdown when the analysis includes multi-speaker or diarization context.',
  audio: GLOSSARY.audioSignalTab,
  transcript: 'The message or transcript text used for analysis; may be redacted depending on storage and your role.',
  usage: 'Estimated Whisper and GPT token usage and costs attributed to this feedback item.',
}

/** Evidence / IoCol row labels (exact keys) → tooltip */
export const ROW_HINTS = {
  'Original character count': 'Length of the source text before analysis, used for context on verbosity.',

  Source:
    'Where inputs came from: transcript-only, or audio plus transcript when a recording was processed.',

  'Viewer sees unredacted source':
    'Whether your account received raw identifiers or masked placeholders in the stored transcript.',

  'Text shows privacy placeholders':
    'Whether [REDACTED], [NAME], etc. appear in the text shown to you.',

  'Approx. masking tokens in view':
    'Approximate count of privacy placeholder tokens visible in this transcript.',

  'Placeholder categories':
    'Types of redaction applied (e.g. email, phone), when the backend reports them.',

  Notes: 'Extra context on how masking relates to storage policy and analysis.',

  'Word count': 'Number of words in the transcript used for linguistics.',
  'Text length': 'Bucket (short / medium / long) from word count.',
  'Character count': 'Total characters in the transcript string.',

  'Audio duration (approx.)': 'Length of the recording in seconds from audio analysis.',
  'Speech rate (wps)': 'Estimated words per second from the transcript over speaking time.',
  'Silence ratio': 'Fraction of the recording that is silence or non-speech.',
  'Rule-based tone label': 'A simple classifier from acoustic features (pitch/volume/rate), not the LLM’s tone field.',
  'Tone confidence (rule-based)': 'How strongly the rule-based acoustic classifier matched a tone bucket.',
  'Pause count (audio)': 'Number of meaningful pauses detected in the audio.',
  'Avg pause duration (s)': 'Average length of those pauses.',

  'Negation words (surface forms)': 'Words like “not”, “never” that flip or weaken polarity in text.',
  'Negation token count': 'Count of negation tokens found.',
  'Diminisher words': 'Hedges such as “somewhat”, “a little” that soften statements.',
  'Diminisher token count': 'Count of diminisher tokens.',
  'Intensifier words': 'Words like “very”, “extremely” that strengthen statements.',
  'Intensifier token count': 'Count of intensifier tokens.',

  'Analysis mode':
    'Multimodal = text features plus audio-derived features sent into the pipeline. Text = transcript features only.',

  'Tokens examined (words)': 'Word count used as a rough size signal for the sentiment stage.',

  'Tone alignment': 'Whether emotional delivery matches the literal content (e.g. saying “fine” while sounding angry).',

  'LLM input (prompt) tokens': 'Tokens sent to the language model for this analysis.',
  'LLM output (completion) tokens': 'Tokens generated by the model in its reply.',
  'LLM total tokens': 'Prompt + completion token total for this run.',

  'Dominant emotion (model)': 'Primary emotion label from the sentiment model.',
  'Overall tone (model)': 'Overall delivery tone from the sentiment model.',
  Direction: 'Overall sentiment direction (e.g. positive / negative / neutral).',
  'Confidence label': 'Categorical confidence (e.g. high / moderate).',
  'Confidence score': 'Numeric confidence for the overall interpretation.',
  'Signal count': 'How many distinct sentiment signals contributed to the score.',
  'Key phrases detected': 'Phrases the model surfaced as especially indicative.',

  'Topic lexicon': 'Which keyword list or policy was used for topic tagging (e.g. standard).',
  'Matched terms / phrases': 'Terms from the lexicon that matched this feedback.',
  'Primary topic': 'Main theme assigned by the model.',
  'Secondary topic': 'Secondary theme when present.',
  'Key topics (list)': 'All theme tags returned for this item.',

  'Conflict detected': 'Whether the model inferred conflicting signals in the message.',
  'Negativity detected': 'Whether strong negative signals were found.',

  'Evidence count': 'Number of supporting evidence lines attached to the summary.',
  'Insight summary': 'Narrative summary produced in the insight stage.',
  'Recommended action': 'Suggested next step for a human reviewer.',
}

export function rowHint(key) {
  return ROW_HINTS[key] ?? null
}
