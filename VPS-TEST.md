# تست Arc Souk روی VPS (حالت dev سریع · پستگرس محلی · دسترسی با IP)

> همه‌جا `VPS_IP` رو با آی‌پی واقعی سرورت عوض کن. فرض بر اوبونتو ۲۲/۲۴ است.

---

## ۱) اتصال به سرور
```bash
ssh root@VPS_IP
```

## ۲) نصب Node 20 و ابزارها
```bash
sudo apt update && sudo apt -y upgrade
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt -y install nodejs git tmux
node -v   # باید v20.x باشه
```

## ۳) نصب پستگرس و ساخت دیتابیس
```bash
sudo apt -y install postgresql postgresql-contrib
sudo systemctl enable --now postgresql

# یک کاربر و دیتابیس بساز (رمز رو عوض کن)
sudo -u postgres psql -c "CREATE USER arcsouk WITH PASSWORD 'CHANGE_ME_STRONG';"
sudo -u postgres psql -c "CREATE DATABASE arcsouk OWNER arcsouk;"
```
آدرس دیتابیس برای `.env`:
```
postgresql://arcsouk:CHANGE_ME_STRONG@localhost:5432/arcsouk
```

## ۴) آوردن کد روی سرور

**گزینه A — آپلود مستقیم از ویندوز** (پوشهٔ تو node_modules نداره، پس تمیزه).
توی PowerShell سیستم خودت:
```powershell
scp -r D:\NODEs\Makes\ArcNew root@VPS_IP:/root/arc-souk
```
**گزینه B — از طریق GitHub** (اگه قبلاً push کردی):
```bash
git clone https://github.com/<you>/arc-souk.git /root/arc-souk
```

## ۵) ساخت فایل .env
```bash
cd /root/arc-souk
cp .env.example .env
# یک سکرت بساز:
openssl rand -base64 32
nano .env
```
حداقل این مقادیر رو پر کن:
```ini
NEXT_PUBLIC_APP_URL=http://VPS_IP:3000
DATABASE_URL=postgresql://arcsouk:CHANGE_ME_STRONG@localhost:5432/arcsouk
NEXTAUTH_URL=http://VPS_IP:3000
NEXTAUTH_SECRET=<خروجی openssl بالا>
ADMIN_EMAILS=you@example.com

# Arc testnet (پیش‌فرض‌ها درستن؛ این دوتا رو پر کن تا پرداخت کار کنه)
NEXT_PUBLIC_ARC_RPC_URL=https://rpc.testnet.arc.network
NEXT_PUBLIC_ARC_CHAIN_ID=5042002
NEXT_PUBLIC_ARC_EXPLORER=https://testnet.arcscan.app
NEXT_PUBLIC_USDC_ADDRESS=<آدرس قرارداد USDC روی آرک — از داک/فاوست>
NEXT_PUBLIC_PAYMENT_ADDRESS=<ولت دریافت‌کنندهٔ تو>
```
> گوگل / SMTP / Blob رو می‌تونی برای این تستِ IP خالی بذاری.

## ۶) نصب، ساخت جدول‌ها، و دیتای نمونه
```bash
npm install
npm run db:push
npm run db:seed
```

## ۷) باز کردن پورت ۳۰۰۰
```bash
sudo ufw allow OpenSSH
sudo ufw allow 3000/tcp
sudo ufw --force enable
```
> اگه ابرت (مثل AWS/Hetzner/DigitalOcean) فایروال/Security Group جدا داره، پورت **3000** رو اونجا هم باز کن.

## ۸) اجرا (در tmux تا با قطع‌شدن SSH نمیره)
```bash
tmux new -s arc
npm run dev -- -H 0.0.0.0 -p 3000
```
- جدا شدن از tmux: `Ctrl+B` بعد `D`
- برگشتن: `tmux attach -t arc`

حالا توی مرورگر باز کن:
```
http://VPS_IP:3000
```
خودش به `/en` می‌ره. زبان (EN/عربی) و تم شب/روز رو امتحان کن.

---

## تست ورود و پرداخت
- **ورود:** «Email me a code» یا ایمیل/رمز رو بزن. چون SMTP نذاشتی، **کد ورود توی همون پنجرهٔ tmux که dev اجرا می‌شه چاپ می‌شه** — اونجا ببینش و واردش کن.
- **ادمین:** با همون ایمیلی که توی `ADMIN_EMAILS` گذاشتی وارد شو، بعد `/en/admin`.
- **پرداخت:** با MetaMask (روی http هم کار می‌کنه) ولت رو وصل کن، شبکهٔ Arc Testnet خودکار اضافه می‌شه، از فاوست `https://faucet.circle.com` تست‌USDC بگیر، پروفایل (آدرس + تلفن) رو کامل کن، بعد روی محصول «Pay with USDC».

## نکته‌ها / عیب‌یابی
- **باز نمی‌شه؟** پورت ۳۰۰۰ هم توی `ufw` و هم توی پنل فایروال ابرت باید باز باشه؛ و حتماً `-H 0.0.0.0` رو زده باشی.
- **ورود گوگل نیست:** روی IP/HTTP غیرفعاله؛ برای گوگل به دامنه + HTTPS نیاز داری (مرحلهٔ بعد).
- **آپلود عکس/ویدیو کار نمی‌کنه:** به `BLOB_READ_WRITE_TOKEN` (Vercel Blob) نیاز داره؛ برای این تست اختیاریه.
- **تست شبیه پروداکشن:** به‌جای dev می‌تونی `npm run build && npm run start -- -H 0.0.0.0 -p 3000` بزنی (سریع‌تر و بهینه‌تر، ولی برای دیدن سریع همون dev کافیه).
- **به‌روزرسانی کد بعداً:** فایل‌ها رو دوباره آپلود/‏`git pull` کن، بعد `npm install` (اگه پکیج جدید اومد) و دوباره اجرا.
