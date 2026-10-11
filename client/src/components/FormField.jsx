// A labelled input (or textarea) with its validation error underneath
export default function FormField({ label, name, error, multiline = false, ...inputProps }) {
  const Input = multiline ? 'textarea' : 'input';

  return (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      <Input id={name} name={name} {...inputProps} />
      {error && <p className="error">{error}</p>}
    </div>
  );
}
