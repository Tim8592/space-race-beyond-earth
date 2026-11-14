import { descriptionFor } from '../lib/fieldHelp';

export default function FieldHelp({term, text}:{term:string; text?:string}){
  const explanation=text??descriptionFor(term);
  return <span className="field-help" tabIndex={0} role="note"
    aria-label={term+': '+explanation} title={explanation}>
    ?
    <span className="field-help-bubble">{explanation}</span>
  </span>;
}
