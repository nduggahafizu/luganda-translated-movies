#!/bin/bash

# Export MongoDB Data for Migration to Atlas
# This script exports your local MongoDB data so you can import it to MongoDB Atlas

echo "╔══════════════════════════════════════════════════════════════════════╗"
echo "║                                                                      ║"
echo "║              📦 EXPORT MONGODB DATA FOR ATLAS 📦                     ║"
echo "║                                                                      ║"
echo "╚══════════════════════════════════════════════════════════════════════╝"
echo ""

# Check if MongoDB is running
if ! mongosh --quiet --eval "db.version()" > /dev/null 2>&1; then
    echo "❌ MongoDB is not running!"
    echo "   Please start MongoDB first:"
    echo "   mongod --dbpath /data/db --bind_ip 127.0.0.1 --port 27017 --logpath /data/db/mongod.log --fork"
    exit 1
fi

echo "✅ MongoDB is running"
echo ""

# Create backup directory
BACKUP_DIR="/tmp/luganda-movies-backup"
mkdir -p "$BACKUP_DIR"

echo "📂 Backup directory: $BACKUP_DIR"
echo ""

# Export database
echo "📤 Exporting luganda-movies database..."
mongodump --db luganda-movies --out "$BACKUP_DIR"

if [ $? -eq 0 ]; then
    echo "✅ Export successful!"
    echo ""
    
    # Show what was exported
    echo "📊 Exported collections:"
    ls -lh "$BACKUP_DIR/luganda-movies/"
    echo ""
    
    # Count documents
    echo "📈 Document counts:"
    mongosh luganda-movies --quiet --eval "
        print('   Movies: ' + db.lugandamovies.countDocuments());
        print('   VJs: ' + db.vjs.countDocuments());
        print('   Users: ' + db.users.countDocuments());
        print('   Payments: ' + db.payments.countDocuments());
    "
    echo ""
    
    echo "═══════════════════════════════════════════════════════════════════════"
    echo "                    ✅ EXPORT COMPLETE!"
    echo "═══════════════════════════════════════════════════════════════════════"
    echo ""
    echo "Backup location: $BACKUP_DIR"
    echo ""
    echo "Next steps:"
    echo "1. Create MongoDB Atlas cluster"
    echo "2. Get your Atlas connection string"
    echo "3. Run import command:"
    echo ""
    echo "   mongorestore --uri \"mongodb+srv://user:pass@cluster.mongodb.net/luganda-movies\" $BACKUP_DIR/luganda-movies"
    echo ""
    echo "═══════════════════════════════════════════════════════════════════════"
else
    echo "❌ Export failed!"
    echo "   Please check if MongoDB is running and accessible"
    exit 1
fi
