
@echo off
echo ⚠️ ATENCION: Esto sobrescribira la version de GitHub con tu version local.
echo.
echo 🔌 Conectando y forzando subida...
git remote add origin https://github.com/partyfinderpro/partyfinder-2.0.git
git branch -M main
git push -u origin main --force
echo.
echo ✅ Si ves esto y no hay errores rojos, ¡se subio todo!
pause
