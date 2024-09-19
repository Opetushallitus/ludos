import org.jetbrains.kotlin.gradle.tasks.KotlinCompile
import org.springframework.boot.gradle.tasks.bundling.BootJar
import org.springframework.boot.gradle.tasks.run.BootRun

plugins {
    id("org.springframework.boot") version "3.3.2"
    id("io.spring.dependency-management") version "1.1.6"
    kotlin("jvm") version "2.0.20"
    kotlin("plugin.spring") version "2.0.20"
}

group = "fi.oph"
version = "0.0.1-SNAPSHOT"
java.sourceCompatibility = JavaVersion.VERSION_17

repositories {
    mavenCentral()
    maven(url = "https://maven.pkg.github.com/Opetushallitus/java-utils") {
        credentials {
            username = "does-not-matter"
            password = project.findProperty("gpr.key") as String? ?: System.getenv("GITHUB_TOKEN")
        }
    }
}

dependencies {
    developmentOnly("org.springframework.boot:spring-boot-devtools")

    implementation("io.arrow-kt:arrow-core:1.2.4")
    implementation("com.fasterxml.jackson.datatype:jackson-datatype-jsr310:2.17.2")
    implementation("com.fasterxml.jackson.module:jackson-module-kotlin:2.17.2")
    implementation("fi.vm.sade.java-utils:java-http:1.0.0-SNAPSHOT")
    implementation("io.github.cdimascio:dotenv-kotlin:6.4.2")
    implementation("jakarta.servlet:jakarta.servlet-api:6.1.0")
    implementation("ch.qos.logback:logback-access:1.4.14")
    implementation("net.logstash.logback:logstash-logback-encoder:7.4")
    implementation("org.flywaydb:flyway-core:10.18.0")
    implementation("org.flywaydb:flyway-database-postgresql:10.18.0")
    implementation("org.jetbrains.kotlin:kotlin-reflect:2.0.20")
    implementation("org.jsoup:jsoup:1.18.1")
    implementation("software.amazon.awssdk:cloudwatchlogs:2.28.4")
    implementation("software.amazon.awssdk:s3:2.28.4")
    implementation("software.amazon.awssdk:sso:2.28.4")
    implementation("software.amazon.awssdk:ssooidc:2.28.4")
    implementation("org.springframework.security:spring-security-cas:6.3.3")
    implementation("org.springframework:spring-test:6.1.13")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-validation")
    implementation("org.springframework.boot:spring-boot-starter-cache")
    implementation("org.springframework.boot:spring-boot-starter-security")
    implementation("org.springframework.session:spring-session-jdbc")
    implementation("org.postgresql:postgresql:42.7.4")
    testImplementation("org.reflections:reflections:0.10.2")
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("org.springframework.security:spring-security-test")
}

tasks.withType<KotlinCompile> {
    kotlinOptions {
        freeCompilerArgs = listOf("-Xjsr305=strict")
        jvmTarget = "17"
    }
}

val pathToStatic = "server/build/resources/main/static"

val linkJar = tasks.register("linkJar") {
    mustRunAfter(tasks.withType<BootJar>())

    doLast {
        exec {
            workingDir("build/libs")
            commandLine("ln", "-vf", "ludos-${version}.jar", "ludos.jar")
        }
    }
}

tasks.withType<BootJar> {
    dependsOn(tasks.withType<KotlinCompile>())
    finalizedBy(linkJar)
}

tasks.withType<BootRun> {
    dependsOn(tasks.withType<KotlinCompile>())
}

tasks.withType<Test> {
    dependsOn(tasks.withType<KotlinCompile>())
    useJUnitPlatform()
    systemProperty("spring.profiles.active", "local")
    testLogging {
        showStandardStreams = true
    }
}
