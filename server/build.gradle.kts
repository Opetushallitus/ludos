import java.nio.file.Files
import java.nio.file.StandardCopyOption
import org.jetbrains.kotlin.gradle.tasks.KotlinCompile
import org.springframework.boot.gradle.tasks.bundling.BootJar
import org.springframework.boot.gradle.tasks.run.BootRun

plugins {
    id("org.springframework.boot") version "3.5.7"
    kotlin("jvm") version "2.3.0"
    kotlin("plugin.spring") version "2.3.0"
}

group = "fi.oph"
version = "0.0.1-SNAPSHOT"

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(25)
    }
}

repositories {
    mavenCentral()
}

dependencyLocking {
    lockAllConfigurations()
}

configurations.all {
    resolutionStrategy.dependencySubstitution {
        substitute(module("org.bouncycastle:bcprov-jdk15on"))
            .using(module("org.bouncycastle:bcprov-jdk18on:1.83"))
        substitute(module("org.bouncycastle:bcpkix-jdk15on"))
            .using(module("org.bouncycastle:bcpkix-jdk18on:1.83"))
        substitute(module("org.bouncycastle:bcutil-jdk15on"))
            .using(module("org.bouncycastle:bcutil-jdk18on:1.83"))
    }
}

dependencies {
    implementation(platform("org.springframework.boot:spring-boot-dependencies:3.5.9"))

    developmentOnly("org.springframework.boot:spring-boot-devtools:3.5.6")
    implementation("org.apache.httpcomponents:httpclient:4.5.14")
    implementation("org.apache.httpcomponents:httpclient-cache:4.5.14")
    implementation("org.apache.commons:commons-lang3:3.20.0")
    implementation("io.arrow-kt:arrow-core:2.2.1")
    implementation("com.fasterxml.jackson.datatype:jackson-datatype-jsr310:2.20.1")
    implementation("com.fasterxml.jackson.module:jackson-module-kotlin:2.20.1")
    implementation("io.github.cdimascio:dotenv-kotlin:6.5.1")
    implementation("jakarta.servlet:jakarta.servlet-api:6.1.0")
    implementation("org.flywaydb:flyway-core:11.20.0")
    implementation("org.flywaydb:flyway-database-postgresql:11.20.0")
    implementation("ch.qos.logback.access:logback-access-common:2.0.7")
    implementation("net.logstash.logback:logstash-logback-encoder:8.1")
    implementation("ch.qos.logback.access:logback-access-tomcat:2.0.7")
    implementation("org.jetbrains.kotlin:kotlin-reflect:2.3.0")
    implementation("org.jsoup:jsoup:1.22.1")
    implementation("software.amazon.awssdk:cloudwatchlogs:2.41.14")
    implementation("software.amazon.awssdk:s3:2.41.14")
    implementation("software.amazon.awssdk:sso:2.41.14")
    implementation("software.amazon.awssdk:ssooidc:2.41.14")
    implementation("org.springframework.security:spring-security-cas:6.5.7")
    implementation("com.nimbusds:nimbus-jose-jwt:9.37.4")
    implementation("ch.qos.logback:logback-core:1.5.19")
    implementation("org.apache.tomcat.embed:tomcat-embed-core:10.1.47")
    implementation("org.springframework:spring-test:6.2.15")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-validation")
    implementation("org.springframework.boot:spring-boot-starter-cache")
    implementation("org.springframework.boot:spring-boot-starter-security")
    implementation("org.springframework.session:spring-session-jdbc")
    implementation("org.postgresql:postgresql:42.7.8")
    testImplementation("org.reflections:reflections:0.10.2")
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("org.springframework.security:spring-security-test")

    compileOnly("org.projectlombok:lombok:1.18.42")
    annotationProcessor("org.projectlombok:lombok:1.18.42")

    testCompileOnly("org.projectlombok:lombok:1.18.42")
    testAnnotationProcessor("org.projectlombok:lombok:1.18.42")
}

kotlin {
    compilerOptions {
        freeCompilerArgs.addAll(listOf("-Xjsr305=strict"))
    }
}

val bootJar = tasks.named<BootJar>("bootJar")

val pathToStatic = "server/build/resources/main/static"

val linkJar = tasks.register("linkJar") {
   dependsOn(bootJar)
   mustRunAfter(bootJar)

    // Use providers to resolve paths lazily and safely.
    val libsDir = layout.buildDirectory.dir("libs")
    val bootArchive = bootJar.flatMap { it.archiveFile }

    doLast {
        val libs = libsDir.get().asFile.toPath()
        val targetJar = bootArchive.get().asFile.toPath()        // e.g. ludos-<version>.jar
        val linkPath = libs.resolve("ludos.jar")

        // Clean up any previous link/file.
        Files.deleteIfExists(linkPath)

        // Try to create a symlink; if not supported (e.g. Windows without privileges), fall back to copying.
        try {
            // Relative target keeps the symlink stable if the folder moves.
            val relativeTarget = libs.relativize(targetJar)
            Files.createSymbolicLink(linkPath, relativeTarget)
            logger.lifecycle("Created symlink: {} → {}", linkPath.fileName, relativeTarget)
        } catch (ex: Exception) {
            Files.copy(targetJar, linkPath, StandardCopyOption.REPLACE_EXISTING)
            logger.lifecycle("Symlinks unavailable; copied {} to {}", targetJar.fileName, linkPath.fileName)
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
