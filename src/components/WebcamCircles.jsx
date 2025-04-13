"use client"

import { useRef, useEffect, useState } from "react"

const WebcamCircles = () => {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [isVideoReady, setIsVideoReady] = useState(false)

  useEffect(() => {
    const initWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play()
        }
      } catch (err) {
        console.error("Failed to access webcam", err)
      }
    }

    initWebcam()
  }, [])

  useEffect(() => {
    let animationFrameId

    const processFrame = () => {
      captureAndProcess()
      animationFrameId = requestAnimationFrame(processFrame)
    }

    if (isVideoReady) {
      processFrame()
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId)
    }
  }, [isVideoReady])

  const captureAndProcess = () => {
    const video = videoRef.current
    const canvas = canvasRef.current

    if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
      const { videoWidth, videoHeight } = video

      // Match canvas to screen size
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight

      const ctx = canvas.getContext("2d")
      if (ctx) {
        // Scale and draw webcam to match screen
        ctx.save()
        ctx.translate(canvas.width, 0)
        ctx.scale(-1, 1)
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        ctx.restore()

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        processImageData(imageData, ctx)
      }
    }
  }

  const processImageData = (imageData, ctx) => {
    const { width, height, data } = imageData
    ctx.fillStyle = "black"
    ctx.fillRect(0, 0, width, height)

    const circleSize = 10
    const spacing = 12

    for (let y = 0; y < height; y += spacing) {
      for (let x = 0; x < width; x += spacing) {
        const i = (y * width + x) * 4
        const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3
        const radius = (brightness / 255) * (circleSize / 2)

        ctx.beginPath()
        ctx.arc(x, y, radius, 0, Math.PI * 2)
        const gray = Math.floor(brightness)
        ctx.fillStyle = `rgb(${gray}, ${gray}, ${gray})` // black & white effect
        ctx.fill()
      }
    }
  }

  const handleCanPlay = () => {
    setIsVideoReady(true)
  }

  // Optional: update canvas on window resize
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth
        canvasRef.current.height = window.innerHeight
      }
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return (
    <div className="fixed inset-0 bg-black z-0">
      <video
        ref={videoRef}
        style={{ display: "none" }}
        onCanPlay={handleCanPlay}
        playsInline
        muted
      />
      <canvas
        ref={canvasRef}
        className="w-full h-full"
      />
    </div>
  )
}

export default WebcamCircles
