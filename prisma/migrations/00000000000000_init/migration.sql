-- CreateTable
CREATE TABLE "LifeAdminMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "receivedAt" DATETIME NOT NULL,
    "dueDate" DATETIME,
    "priority" TEXT NOT NULL,
    "suggestedAction" TEXT NOT NULL,
    "confidence" REAL NOT NULL,
    "status" TEXT NOT NULL,
    "originalMessage" TEXT NOT NULL,
    "flaggedReason" TEXT NOT NULL,
    "extractedFieldsJson" TEXT NOT NULL DEFAULT '[]',
    "financialImpact" REAL,
    "documentSaveRecommended" BOOLEAN NOT NULL DEFAULT false,
    "documentSavedAt" DATETIME,
    "needsReply" BOOLEAN NOT NULL DEFAULT false,
    "appointmentStart" DATETIME,
    "snoozedUntil" DATETIME,
    "taskCreatedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ManualTask" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceMessageId" TEXT,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "dueDate" DATETIME,
    "priority" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "suggestedAction" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "snoozedUntil" DATETIME,
    CONSTRAINT "ManualTask_sourceMessageId_fkey" FOREIGN KEY ("sourceMessageId") REFERENCES "LifeAdminMessage" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DocumentRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceMessageId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "savedAt" DATETIME NOT NULL,
    "notes" TEXT,
    CONSTRAINT "DocumentRecord_sourceMessageId_fkey" FOREIGN KEY ("sourceMessageId") REFERENCES "LifeAdminMessage" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserSettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "disabledCategoriesJson" TEXT NOT NULL DEFAULT '[]',
    "approvalSendingMessages" BOOLEAN NOT NULL DEFAULT true,
    "approvalPayments" BOOLEAN NOT NULL DEFAULT true,
    "approvalCancellations" BOOLEAN NOT NULL DEFAULT true,
    "weeklyBriefingDay" TEXT NOT NULL DEFAULT 'Monday',
    "timezone" TEXT NOT NULL DEFAULT 'America/Chicago',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "IntegrationConnection" (
    "provider" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "permissionScopesJson" TEXT NOT NULL DEFAULT '[]',
    "lastSyncAt" DATETIME,
    "lastSyncCursor" TEXT,
    "connectedAt" DATETIME,
    "notes" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadataJson" TEXT
);

-- CreateTable
CREATE TABLE "ApprovalRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "actionType" TEXT NOT NULL,
    "sourceMessageId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "reviewedAt" DATETIME,
    "reviewerNote" TEXT,
    CONSTRAINT "ApprovalRequest_sourceMessageId_fkey" FOREIGN KEY ("sourceMessageId") REFERENCES "LifeAdminMessage" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RawLifeAdminMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "provider" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "receivedAt" DATETIME NOT NULL,
    "externalId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "IngestionRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "provider" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startedAt" DATETIME NOT NULL,
    "completedAt" DATETIME NOT NULL,
    "inputCount" INTEGER NOT NULL,
    "createdItemIdsJson" TEXT NOT NULL DEFAULT '[]',
    "duplicateCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "errorMessagesJson" TEXT NOT NULL DEFAULT '[]',
    "cursor" TEXT,
    "notes" TEXT
);

-- CreateIndex
CREATE INDEX "LifeAdminMessage_category_idx" ON "LifeAdminMessage"("category");

-- CreateIndex
CREATE INDEX "LifeAdminMessage_status_idx" ON "LifeAdminMessage"("status");

-- CreateIndex
CREATE INDEX "LifeAdminMessage_dueDate_idx" ON "LifeAdminMessage"("dueDate");

-- CreateIndex
CREATE INDEX "LifeAdminMessage_priority_idx" ON "LifeAdminMessage"("priority");

-- CreateIndex
CREATE UNIQUE INDEX "ManualTask_sourceMessageId_key" ON "ManualTask"("sourceMessageId");

-- CreateIndex
CREATE INDEX "ManualTask_category_idx" ON "ManualTask"("category");

-- CreateIndex
CREATE INDEX "ManualTask_status_idx" ON "ManualTask"("status");

-- CreateIndex
CREATE INDEX "ManualTask_dueDate_idx" ON "ManualTask"("dueDate");

-- CreateIndex
CREATE INDEX "ManualTask_priority_idx" ON "ManualTask"("priority");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentRecord_sourceMessageId_key" ON "DocumentRecord"("sourceMessageId");

-- CreateIndex
CREATE INDEX "DocumentRecord_category_idx" ON "DocumentRecord"("category");

-- CreateIndex
CREATE INDEX "DocumentRecord_status_idx" ON "DocumentRecord"("status");

-- CreateIndex
CREATE INDEX "DocumentRecord_savedAt_idx" ON "DocumentRecord"("savedAt");

-- CreateIndex
CREATE INDEX "IntegrationConnection_status_idx" ON "IntegrationConnection"("status");

-- CreateIndex
CREATE INDEX "AuditEvent_type_idx" ON "AuditEvent"("type");

-- CreateIndex
CREATE INDEX "AuditEvent_entityType_entityId_idx" ON "AuditEvent"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditEvent_createdAt_idx" ON "AuditEvent"("createdAt");

-- CreateIndex
CREATE INDEX "ApprovalRequest_actionType_idx" ON "ApprovalRequest"("actionType");

-- CreateIndex
CREATE INDEX "ApprovalRequest_status_idx" ON "ApprovalRequest"("status");

-- CreateIndex
CREATE INDEX "ApprovalRequest_sourceMessageId_idx" ON "ApprovalRequest"("sourceMessageId");

-- CreateIndex
CREATE INDEX "ApprovalRequest_riskLevel_idx" ON "ApprovalRequest"("riskLevel");

-- CreateIndex
CREATE UNIQUE INDEX "ApprovalRequest_sourceMessageId_actionType_status_key" ON "ApprovalRequest"("sourceMessageId", "actionType", "status");

-- CreateIndex
CREATE INDEX "RawLifeAdminMessage_provider_idx" ON "RawLifeAdminMessage"("provider");

-- CreateIndex
CREATE INDEX "RawLifeAdminMessage_source_idx" ON "RawLifeAdminMessage"("source");

-- CreateIndex
CREATE INDEX "RawLifeAdminMessage_receivedAt_idx" ON "RawLifeAdminMessage"("receivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "RawLifeAdminMessage_provider_externalId_key" ON "RawLifeAdminMessage"("provider", "externalId");

-- CreateIndex
CREATE INDEX "IngestionRun_provider_idx" ON "IngestionRun"("provider");

-- CreateIndex
CREATE INDEX "IngestionRun_status_idx" ON "IngestionRun"("status");

-- CreateIndex
CREATE INDEX "IngestionRun_startedAt_idx" ON "IngestionRun"("startedAt");
