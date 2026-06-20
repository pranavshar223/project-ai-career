const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  { file: 'src/pages/Resources.tsx', from: "import { useAuth } from '../contexts/AuthContext';", to: "import { useAuth } from '../hooks/useAuth';" },
  { file: 'src/pages/Profile.tsx', from: "import { useAuth } from '../contexts/AuthContext';", to: "import { useAuth } from '../hooks/useAuth';" },
  { file: 'src/pages/Onboarding.tsx', from: "import { useAuth } from '../contexts/AuthContext';", to: "import { useAuth } from '../hooks/useAuth';" },
  { file: 'src/pages/Jobs.tsx', from: "import { useAuth } from '../contexts/AuthContext';", to: "import { useAuth } from '../hooks/useAuth';" },
  { file: 'src/pages/Dashboard.tsx', from: 'import { useAuth } from "../contexts/AuthContext";', to: "import { useAuth } from '../hooks/useAuth';" },
  { file: 'src/pages/Chat.tsx', from: 'import { useAuth } from "../contexts/AuthContext";', to: "import { useAuth } from '../hooks/useAuth';" },
  { file: 'src/components/Layout/Header.tsx', from: "import { useAuth } from '../../contexts/AuthContext';", to: "import { useAuth } from '../../hooks/useAuth';" },
  { file: 'src/components/Auth/AuthForm.tsx', from: "import { useAuth } from '../../contexts/AuthContext';", to: "import { useAuth } from '../../hooks/useAuth';" },
  { file: 'src/pages/Settings.tsx', from: "import { useTheme } from '../contexts/ThemeContext';", to: "import { useTheme } from '../hooks/useTheme';" },
];

filesToUpdate.forEach(({ file, from, to }) => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(from, to);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});

// Handle App.tsx separately
const appPath = path.join(__dirname, 'src/App.tsx');
if (fs.existsSync(appPath)) {
  let appContent = fs.readFileSync(appPath, 'utf8');
  appContent = appContent.replace("import { AuthProvider, useAuth } from './contexts/AuthContext';", "import { AuthProvider } from './contexts/AuthContext';\nimport { useAuth } from './hooks/useAuth';");
  fs.writeFileSync(appPath, appContent, 'utf8');
  console.log(`Updated src/App.tsx`);
}
