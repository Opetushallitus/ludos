package fi.oph.ludos

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication

@SpringBootApplication
class LudosApplication

fun main(args: Array<String>) {
    runApplication<LudosApplication>(*args)
}
