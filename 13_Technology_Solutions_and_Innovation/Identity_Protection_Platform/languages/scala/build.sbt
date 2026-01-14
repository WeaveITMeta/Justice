ThisBuild / version := "1.0.0"
ThisBuild / scalaVersion := "3.3.1"
ThisBuild / organization := "gov.justice"

lazy val root = (project in file("."))
  .settings(
    name := "justice-identity-protection",
    description := "Scala implementation of Justice Identity Protection Platform for big data and distributed systems",
    
    libraryDependencies ++= Seq(
      // Blockchain & Crypto
      "org.web3j" % "core" % "4.9.8",
      "com.eclipsesource.minimal-json" % "minimal-json" % "0.9.5",
      "org.bouncycastle" % "bcprov-jdk15on" % "1.70",
      
      // Akka for distributed systems
      "com.typesafe.akka" %% "akka-actor-typed" % "2.8.5",
      "com.typesafe.akka" %% "akka-cluster-typed" % "2.8.5",
      "com.typesafe.akka" %% "akka-serialization-jackson" % "2.8.5",
      
      // HTTP & JSON
      "com.typesafe.akka" %% "akka-http" % "10.5.3",
      "io.circe" %% "circe-core" % "0.14.6",
      "io.circe" %% "circe-generic" % "0.14.6",
      "io.circe" %% "circe-parser" % "0.14.6",
      
      // Database & Storage
      "org.tpolecat" %% "doobie-core" % "1.0.0-RC4",
      "org.tpolecat" %% "doobie-postgres" % "1.0.0-RC4",
      "org.tpolecat" %% "doobie-hikari" % "1.0.0-RC4",
      
      // Big Data Processing
      "org.apache.spark" %% "spark-core" % "3.5.0",
      "org.apache.spark" %% "spark-sql" % "3.5.0",
      "org.apache.spark" %% "spark-mllib" % "3.5.0",
      
      // Image Processing
      "org.bytedeco" % "javacv-platform" % "1.5.9",
      
      // Testing
      "org.scalatest" %% "scalatest" % "3.2.17" % Test,
      "com.typesafe.akka" %% "akka-actor-testkit-typed" % "2.8.5" % Test
    ),
    
    scalacOptions ++= Seq(
      "-deprecation",
      "-feature",
      "-unchecked",
      "-Xlint",
      "-Ywarn-dead-code",
      "-Ywarn-numeric-widen"
    ),
    
    // Assembly for fat JAR
    assembly / assemblyMergeStrategy := {
      case PathList("META-INF", xs @ _*) => MergeStrategy.discard
      case x => MergeStrategy.first
    }
  )

// Multi-module structure for different blockchain integrations
lazy val cardano = (project in file("modules/cardano"))
  .dependsOn(root)
  .settings(
    libraryDependencies ++= Seq(
      "io.github.pshirshov.izumi" %% "cardano-pab-client" % "0.1.0"
    )
  )

lazy val ethereum = (project in file("modules/ethereum"))
  .dependsOn(root)
  .settings(
    libraryDependencies ++= Seq(
      "org.web3j" % "core" % "4.9.8",
      "org.web3j" % "contracts" % "4.9.8"
    )
  )

lazy val governmentDashboard = (project in file("modules/dashboard"))
  .dependsOn(root)
  .settings(
    libraryDependencies ++= Seq(
      "com.typesafe.play" %% "play" % "2.9.0",
      "com.typesafe.play" %% "play-json" % "2.10.1"
    )
  )
