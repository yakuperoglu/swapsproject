@echo off
echo Setting up backend environment variables...

cd backend || exit /b

echo DB_HOST=database> .env
echo DB_PORT=5432>> .env
echo DB_USER=postgres>> .env
echo DB_PASSWORD=postgres>> .env
echo DB_NAME=swaps_db>> .env
echo JWT_SECRET=bu_cok_gizli_bir_anahtardir_degistirmeyi_unutmayin>> .env
echo NODE_ENV=production>> .env
echo PORT=3000>> .env

echo .env file created successfully!
cd ..
