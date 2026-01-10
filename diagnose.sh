#!/bin/bash

echo "🔍 Mosaic Animator - Diagnostic Check"
echo "======================================"
echo ""

# Check Node version
echo "1. Checking Node.js version..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "   ✅ Node.js: $NODE_VERSION"
    
    # Check if version is 16+
    MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
    if [ "$MAJOR_VERSION" -lt 16 ]; then
        echo "   ⚠️  Warning: Node 16+ recommended (you have Node $MAJOR_VERSION)"
    fi
else
    echo "   ❌ Node.js not found! Please install Node.js 16+"
    exit 1
fi

echo ""

# Check npm version
echo "2. Checking npm version..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo "   ✅ npm: $NPM_VERSION"
else
    echo "   ❌ npm not found!"
    exit 1
fi

echo ""

# Check if node_modules exists
echo "3. Checking dependencies..."
if [ -d "node_modules" ]; then
    echo "   ✅ node_modules folder exists"
    
    # Check specific dependencies
    if [ -d "node_modules/react" ]; then
        echo "   ✅ React installed"
    else
        echo "   ❌ React missing - run: npm install"
    fi
    
    if [ -d "node_modules/vite" ]; then
        echo "   ✅ Vite installed"
    else
        echo "   ❌ Vite missing - run: npm install"
    fi
    
    if [ -d "node_modules/gif.js" ]; then
        echo "   ✅ gif.js installed"
    else
        echo "   ❌ gif.js missing - run: npm install"
    fi
else
    echo "   ❌ node_modules not found"
    echo "   → Run: npm install"
    exit 1
fi

echo ""

# Check if port 5173 is available
echo "4. Checking port availability..."
if command -v lsof &> /dev/null; then
    if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "   ⚠️  Port 5173 is in use"
        echo "   → Try: npm run dev -- --port 3000"
    else
        echo "   ✅ Port 5173 is available"
    fi
elif command -v netstat &> /dev/null; then
    if netstat -an | grep 5173 | grep LISTEN >/dev/null 2>&1; then
        echo "   ⚠️  Port 5173 is in use"
        echo "   → Try: npm run dev -- --port 3000"
    else
        echo "   ✅ Port 5173 is available"
    fi
else
    echo "   ⚠️  Cannot check port (lsof/netstat not available)"
fi

echo ""

# Check for TypeScript errors
echo "5. Checking TypeScript configuration..."
if [ -f "tsconfig.json" ]; then
    echo "   ✅ tsconfig.json exists"
else
    echo "   ❌ tsconfig.json missing"
fi

echo ""

# Final recommendations
echo "======================================"
echo "📋 Next Steps:"
echo ""

if [ ! -d "node_modules" ]; then
    echo "   1. Run: npm install"
    echo "   2. Run: npm run dev"
else
    echo "   Run: npm run dev"
fi

echo ""
echo "   Then open: http://localhost:5173"
echo ""
echo "🆘 If issues persist:"
echo "   1. Check browser console (F12) for errors"
echo "   2. Try: npm run dev -- --host 0.0.0.0"
echo "   3. Try different port: npm run dev -- --port 3000"
echo ""
