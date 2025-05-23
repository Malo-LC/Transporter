import { RadioFilterProps } from '@lib/plume-search/filters/FilterTypes';
import { FormControlLabel, Radio } from '@mui/material';

function RadioFilter(
  {
    label,
    value,
    disabled,
    selected,
    className,
    onValueClicked,
    RadioProps,
  }: Readonly<RadioFilterProps>,
) {
  return (
    <FormControlLabel
      disabled={disabled ?? false}
      className={className}
      label={label}
      control={
        <Radio
          {...(RadioProps ?? {})}
          value={value}
          checked={selected}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            onValueClicked(e.target.checked);
          }}
          disabled={disabled ?? false}
        />
      }
    />
  );
}

export default RadioFilter;
