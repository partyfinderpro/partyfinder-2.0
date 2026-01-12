
@echo off
echo 🔌 Conectando con GitHub...
git remote add origin https://github.com/partyfinderpro/partyfinder-2.0.git
git branch -M main
echo 🚀 Subiendo archivos...
git push -u origin main
echo.
echo Si te pide usuario y contraseña, usa tu navegador o token.
echo Si dice "remote origin already exists", es normal, intentará subir de todas formas.
pause
