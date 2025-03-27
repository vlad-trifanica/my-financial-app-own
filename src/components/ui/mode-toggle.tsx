import { Moon, Sun } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

export function ModeToggle() {
  const { theme, setTheme } = useTheme()

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <div className="flex items-center space-x-2">
      <Label htmlFor="theme-toggle" className="cursor-pointer">
        {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
      </Label>
      <Switch
        id="theme-toggle"
        checked={theme === 'dark'}
        onCheckedChange={toggleTheme}
        className="cursor-pointer hover:scale-105 transition-transform"
      />
    </div>
  )
}