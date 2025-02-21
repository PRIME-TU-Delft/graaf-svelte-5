-- CreateTable
CREATE TABLE "_PinnedCourse" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_PinnedCourse_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_PinnedCourse_B_index" ON "_PinnedCourse"("B");

-- AddForeignKey
ALTER TABLE "_PinnedCourse" ADD CONSTRAINT "_PinnedCourse_A_fkey" FOREIGN KEY ("A") REFERENCES "Course"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PinnedCourse" ADD CONSTRAINT "_PinnedCourse_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
