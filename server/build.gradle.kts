import org.jetbrains.kotlin.gradle.tasks.KotlinCompile
import org.springframework.boot.gradle.tasks.bundling.BootJar
import org.springframework.boot.gradle.tasks.run.BootRun
import org.jetbrains.kotlin.gradle.dsl.JvmTarget

plugins {
    id("org.springframework.boot") version "3.5.4"
    kotlin("jvm") version "2.2.10"
    kotlin("plugin.spring") version "2.2.10"
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

dependencyLocking {
    lockAllConfigurations()
}

dependencies {
    implementation(platform("org.springframework.boot:spring-boot-dependencies:3.5.4"))

    developmentOnly("org.springframework.boot:spring-boot-devtools:3.5.4")

    implementation("io.arrow-kt:arrow-core:2.1.2")
    implementation("com.fasterxml.jackson.datatype:jackson-datatype-jsr310:2.19.2")
    implementation("com.fasterxml.jackson.module:jackson-module-kotlin:2.19.2")
    implementation("fi.vm.sade.java-utils:java-http:1.0.0-SNAPSHOT")
    implementation("io.github.cdimascio:dotenv-kotlin:6.5.1")
    implementation("jakarta.servlet:jakarta.servlet-api:6.1.0")
    implementation("org.flywaydb:flyway-core:11.11.0")
    implementation("org.flywaydb:flyway-database-postgresql:11.11.0")
    implementation("ch.qos.logback.access:logback-access-common:2.0.6")
    implementation("net.logstash.logback:logstash-logback-encoder:8.1")
    implementation("ch.qos.logback.access:logback-access-tomcat:2.0.6")
    implementation("org.jetbrains.kotlin:kotlin-reflect:2.2.10")
    implementation("org.jsoup:jsoup:1.21.1")
    implementation("software.amazon.awssdk:cloudwatchlogs:2.32.22")
    implementation("software.amazon.awssdk:s3:2.32.22")
    implementation("software.amazon.awssdk:sso:2.32.22")
    implementation("software.amazon.awssdk:ssooidc:2.32.22")
    implementation("org.springframework.security:spring-security-cas:6.5.2")
    implementation("org.springframework:spring-test:6.2.10")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-validation")
    implementation("org.springframework.boot:spring-boot-starter-cache")
    implementation("org.springframework.boot:spring-boot-starter-security")
    implementation("org.springframework.session:spring-session-jdbc")
    implementation("org.postgresql:postgresql:42.7.7")
    testImplementation("org.reflections:reflections:0.10.2")
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("org.springframework.security:spring-security-test")
}

kotlin {
    compilerOptions {
        freeCompilerArgs.addAll(listOf("-Xjsr305=strict"))
        jvmTarget = JvmTarget.fromTarget("17")
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
