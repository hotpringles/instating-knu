const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

async function main() {
  const adminStudentId = process.env.ADMIN_ID || "admin";
  const adminPassword = process.env.ADMIN_PASSWORD || "adminpassword";

  // 이미 admin 계정이 있는지 확인
  const existingAdmin = await prisma.user.findUnique({
    where: { studentId: adminStudentId },
  });

  if (!existingAdmin) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    await prisma.user.create({
      data: {
        studentId: adminStudentId,
        password: hashedPassword,
        name: "관리자",
        role: "ADMIN",
      },
    });
    console.log("관리자 계정이 생성되었습니다. (ID: admin, PW: adminpassword)");
  } else {
    console.log("관리자 계정이 이미 존재합니다.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
