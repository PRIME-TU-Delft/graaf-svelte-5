/*
  Warnings:

  - You are about to drop the `_CourseToProgram` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_CourseToProgram" DROP CONSTRAINT "_CourseToProgram_A_fkey";

-- DropForeignKey
ALTER TABLE "_CourseToProgram" DROP CONSTRAINT "_CourseToProgram_B_fkey";

-- DropTable
DROP TABLE "_CourseToProgram";

-- CreateTable
CREATE TABLE "_EditorProgramRelation" (
    "A" UUID NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_EditorProgramRelation_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_AdminProgramRelation" (
    "A" UUID NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_AdminProgramRelation_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ProgramCourse" (
    "A" TEXT NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_ProgramCourse_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_EditorProgramRelation_B_index" ON "_EditorProgramRelation"("B");

-- CreateIndex
CREATE INDEX "_AdminProgramRelation_B_index" ON "_AdminProgramRelation"("B");

-- CreateIndex
CREATE INDEX "_ProgramCourse_B_index" ON "_ProgramCourse"("B");

-- AddForeignKey
ALTER TABLE "_EditorProgramRelation" ADD CONSTRAINT "_EditorProgramRelation_A_fkey" FOREIGN KEY ("A") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EditorProgramRelation" ADD CONSTRAINT "_EditorProgramRelation_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AdminProgramRelation" ADD CONSTRAINT "_AdminProgramRelation_A_fkey" FOREIGN KEY ("A") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AdminProgramRelation" ADD CONSTRAINT "_AdminProgramRelation_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProgramCourse" ADD CONSTRAINT "_ProgramCourse_A_fkey" FOREIGN KEY ("A") REFERENCES "Course"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProgramCourse" ADD CONSTRAINT "_ProgramCourse_B_fkey" FOREIGN KEY ("B") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;
