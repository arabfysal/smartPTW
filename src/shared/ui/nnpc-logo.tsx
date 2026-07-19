import logoUrl from '@/assets/nnpc-logo.svg';

/** Official NNPC logo */
export function NNPCLogo({ size = 40 }: { size?: number }) {
  return (
    <img
      src={logoUrl}
      alt="NNPC logo"
      style={{ height: size, width: 'auto' }}
      draggable={false}
    />
  );
}
