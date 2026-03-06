import { SettingsMenu } from '@/components/SettingsMenu';

export function FixedHeader() {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-1">
      <SettingsMenu className="bg-background/80 backdrop-blur-sm hover:bg-background" />
    </div>
  );
}
