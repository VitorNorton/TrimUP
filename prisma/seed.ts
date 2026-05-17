const { PrismaClient } = require("@prisma/client")

const prisma = new PrismaClient()

async function main() {
  // Limpar dados existentes
  await prisma.booking.deleteMany()
  await prisma.service.deleteMany()
  await prisma.unit.deleteMany()

  // Serviços da marca (iguais em todas as unidades)
  await prisma.service.createMany({
    data: [
      {
        name: "Corte de Cabelo",
        description: "Estilo personalizado com as últimas tendências.",
        price: 60.0,
        imageUrl:
          "https://utfs.io/f/0ddfbd26-a424-43a0-aaf3-c3f1dc6be6d1-1kgxo7.png",
      },
      {
        name: "Barba",
        description: "Modelagem completa para destacar sua masculinidade.",
        price: 40.0,
        imageUrl:
          "https://utfs.io/f/e6bdffb6-24a9-455b-aba3-903c2c2b5bde-1jo6tu.png",
      },
      {
        name: "Pézinho",
        description: "Acabamento perfeito para um visual renovado.",
        price: 35.0,
        imageUrl:
          "https://utfs.io/f/8a457cda-f768-411d-a737-cdb23ca6b9b5-b3pegf.png",
      },
      {
        name: "Sobrancelha",
        description: "Expressão acentuada com modelagem precisa.",
        price: 20.0,
        imageUrl:
          "https://utfs.io/f/2118f76e-89e4-43e6-87c9-8f157500c333-b0ps0b.png",
      },
      {
        name: "Massagem",
        description: "Relaxe com uma massagem revigorante.",
        price: 50.0,
        imageUrl:
          "https://utfs.io/f/c4919193-a675-4c47-9f21-ebd86d1c8e6a-4oen2a.png",
      },
      {
        name: "Hidratação",
        description: "Hidratação profunda para cabelo e barba.",
        price: 25.0,
        imageUrl:
          "https://utfs.io/f/8a457cda-f768-411d-a737-cdb23ca6b9b5-b3pegf.png",
      },
    ],
  })

  // Unidades TrimUp
  const units = [
    {
      name: "TrimUp - Centro",
      address: "Rua XV de Novembro, 220, Centro, São Paulo - SP",
      phones: ["(11) 3333-0001", "(11) 99999-0001"],
      description:
        "Nossa unidade no coração do Centro de São Paulo. Atendimento premium com os melhores barbeiros da cidade, em um ambiente moderno e sofisticado.",
      imageUrl:
        "https://utfs.io/f/c97a2dc9-cf62-468b-a851-bfd2bdde775f-16p.png",
      lat: -23.5489,
      lng: -46.6388,
    },
    {
      name: "TrimUp - Pinheiros",
      address: "Rua dos Pinheiros, 498, Pinheiros, São Paulo - SP",
      phones: ["(11) 3333-0002", "(11) 99999-0002"],
      description:
        "Localizada no bairro mais descolado de SP, a unidade Pinheiros combina estilo e tradição para oferecer a melhor experiência em cuidados masculinos.",
      imageUrl:
        "https://utfs.io/f/45331760-899c-4b4b-910e-e00babb6ed81-16q.png",
      lat: -23.5632,
      lng: -46.6843,
    },
    {
      name: "TrimUp - Moema",
      address: "Av. Ibirapuera, 3103, Moema, São Paulo - SP",
      phones: ["(11) 3333-0003", "(11) 99999-0003"],
      description:
        "No sofisticado bairro de Moema, a TrimUp oferece um espaço exclusivo para o homem que valoriza qualidade e bem-estar.",
      imageUrl:
        "https://utfs.io/f/5832df58-cfd7-4b3f-b102-42b7e150ced2-16r.png",
      lat: -23.5995,
      lng: -46.6658,
    },
    {
      name: "TrimUp - Vila Madalena",
      address: "Rua Aspicuelta, 72, Vila Madalena, São Paulo - SP",
      phones: ["(11) 3333-0004", "(11) 99999-0004"],
      description:
        "Na charmosa Vila Madalena, nossa unidade tem o ambiente ideal para quem busca um corte impecável com toda a vibe do bairro.",
      imageUrl:
        "https://utfs.io/f/7e309eaa-d722-465b-b8b6-76217404a3d3-16s.png",
      lat: -23.5562,
      lng: -46.6916,
    },
    {
      name: "TrimUp - Itaim Bibi",
      address: "Rua Joaquim Floriano, 466, Itaim Bibi, São Paulo - SP",
      phones: ["(11) 3333-0005", "(11) 99999-0005"],
      description:
        "No Itaim Bibi, referência de gastronomia e lifestyle, a TrimUp entrega o mesmo padrão de excelência para o homem moderno.",
      imageUrl:
        "https://utfs.io/f/178da6b6-6f9a-424a-be9d-a2feb476eb36-16t.png",
      lat: -23.5851,
      lng: -46.6769,
    },
    {
      name: "TrimUp - Santana",
      address: "Av. Braz Leme, 1400, Santana, São Paulo - SP",
      phones: ["(11) 3333-0006", "(11) 99999-0006"],
      description:
        "Servindo a zona norte com a qualidade TrimUp. Agendamento fácil e atendimento sem filas para o homem que não tem tempo a perder.",
      imageUrl:
        "https://utfs.io/f/2f9278ba-3975-4026-af46-64af78864494-16u.png",
      lat: -23.4981,
      lng: -46.6259,
    },
  ]

  for (const unit of units) {
    await prisma.unit.create({ data: unit })
  }

  console.log("✅ Seed concluído: serviços e unidades TrimUp criados.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
